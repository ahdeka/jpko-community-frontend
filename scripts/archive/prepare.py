"""운영 종료 시점(2026-11-24) DB 추출본(archive.json)과 S3 미디어를
아카이브 사이트용 데이터(data/archive.json)와 정적 파일(public/media/)로 변환한다.

- 작성자 정보는 추출 단계에서 이미 빠져 있다(user_id·ip·닉네임 미포함).
- 삭제된 댓글은 살아 있는 답글이 있을 때만 "삭제된 댓글" 자리로 남기고 나머지는 버린다.
- 본문·댓글의 CloudFront 주소를 /media/... 로 바꾸고, 큰 jpg/png는 WebP로 줄인다.
사용: python3 scripts/archive/prepare.py <추출 폴더(archive.json, media/)>
"""
import json, os, re, shutil, sys
from PIL import Image

SRC = sys.argv[1]
OUT_DATA = 'data/archive.json'
OUT_MEDIA = 'public/media'
CDN = re.compile(r'https://d1q5c7pfmil9a2\.cloudfront\.net/([^"\'\s<>?\\]+)')
MAX_W, Q, MIN_BYTES = 1600, 80, 300_000

d = json.load(open(os.path.join(SRC, 'archive.json'), encoding='utf-8'))

rename = {}  # 원본 키 → 새 키
def media(key):
    if key in rename:
        return rename[key]
    src = os.path.join(SRC, 'media', key)
    base, ext = os.path.splitext(key)
    new = key
    if ext.lower() in ('.jpg', '.jpeg', '.png') and os.path.getsize(src) > MIN_BYTES:
        im = Image.open(src)
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        new = base + '.webp'
        os.makedirs(os.path.dirname(os.path.join(OUT_MEDIA, new)), exist_ok=True)
        im.save(os.path.join(OUT_MEDIA, new), 'WEBP', quality=Q, method=6)
    else:
        os.makedirs(os.path.dirname(os.path.join(OUT_MEDIA, new)), exist_ok=True)
        shutil.copyfile(src, os.path.join(OUT_MEDIA, new))
    rename[key] = new
    return new

def rewrite(html):
    if not html:
        return html
    html = CDN.sub(lambda m: '/media/' + media(m.group(1)), html)
    # 공지 문의처 링크에 개인 메일이 들어가 있던 것을 공개 문의 메일로 바로잡는다.
    return html.replace('mailto:ahdeka01@gmail.com', 'mailto:jpkocommunity@gmail.com')

for p in d['posts']:
    p['content'] = rewrite(p['content'])
for n in d['notices']:
    n['content'] = rewrite(n['content'])

comments = d['comments'] or []
live_parent = {c['parentId'] for c in comments if c['parentId'] and not c['deleted']}
kept = []
for c in comments:
    if c['deleted'] and (c['parentId'] or c['id'] not in live_parent):
        continue
    if c['imageUrl']:
        c['imageUrl'] = rewrite(c['imageUrl'])
    kept.append(c)
d['comments'] = kept

os.makedirs('data', exist_ok=True)
json.dump(d, open(OUT_DATA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('posts', len(d['posts']), 'notices', len(d['notices']), 'comments', len(kept), 'media', len(rename))
