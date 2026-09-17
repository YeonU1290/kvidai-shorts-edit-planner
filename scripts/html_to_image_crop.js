/*
 * HTML → PNG / JPG 일괄 변환 스크립트
 *
 * ────────────────────────────────────────────────────────────────
 * [사전 준비] Node.js v18+ 필요
 *   https://nodejs.org
 *
 *   1) 기본 변환만 할 경우:
 *      npm install puppeteer
 *      (Chrome ~170MB 자동 다운로드. 방화벽 환경이면 수동 설치 필요)
 *
 *   2) --crop(여백 자동 제거) 사용 시 추가 설치:
 *      npm install sharp
 *
 *      주의: 네트워크 드라이브(공유 드라이브 등)에서는 sharp 설치가
 *      깨질 수 있음. 반드시 로컬 경로에서 설치할 것.
 *        mkdir C:\temp\html2img
 *        cd C:\temp\html2img
 *        npm install puppeteer
 *        npm install sharp
 *        copy "원본경로\html_to_image.js" .
 *
 * ────────────────────────────────────────────────────────────────
 * [실행 준비] 이 파일을 puppeteer/sharp가 설치된 폴더에서 실행
 *   cd C:\temp\html2img
 *
 * ────────────────────────────────────────────────────────────────
 * [실행 예시]
 *
 *   # 기본 (현재 폴더, PNG)
 *   node html_to_image.js
 *
 *   # 지정 폴더, PNG
 *   node html_to_image.js "C:\경로\html폴더"
 *
 *   # 지정 폴더, JPG
 *   node html_to_image.js "C:\경로\html폴더" --format jpg
 *   node html_to_image.js -f jpg "C:\경로\html폴더"
 *
 *   # 흰색/빈 여백 자동 제거 (--crop / -c)
 *   node html_to_image.js --crop "C:\경로\html폴더"
 *
 *   # 여백 감지 민감도 조정 (--threshold / -t, 기본값 10)
 *   # 값이 클수록 덜 엄격하게 trim → 값을 올리면 더 많이 잘림
 *   node html_to_image.js --crop --threshold 20 "C:\경로\html폴더"
 *
 *   # JPG + crop 동시 사용
 *   node html_to_image.js -f jpg --crop "C:\경로\html폴더"
 *
 *   # 이미지 파일만 crop (--images-only / -i)
 *   # HTML 변환 없이 PNG/JPG 파일의 여백만 제거. --crop 과 함께 사용 필수.
 *   # sharp 설치 필요 (npm install sharp), 네트워크 드라이브 금지 → 로컬 경로에서 실행
 *
 *   node html_to_image.js --images-only --crop "C:\경로\images폴더"
 *   node html_to_image.js -i -c "C:\경로\images폴더"
 *
 *   # threshold 조정 (기본 10, 높을수록 더 많이 잘림)
 *   node html_to_image.js -i -c --threshold 20 "C:\경로\images폴더"
 *
 *   # 현재 폴더의 이미지 crop
 *   node html_to_image.js -i -c
 *
 * ────────────────────────────────────────────────────────────────
 * [출력] 동일 폴더에 같은 이름의 .png / .jpg 파일 생성 (원본 덮어쓰기)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');

// --- args 파싱 (Node.js 내장 util.parseArgs) ---
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    format:       { type: 'string',  short: 'f', default: 'png' },
    crop:         { type: 'boolean', short: 'c', default: false },
    threshold:    { type: 'string',  short: 't', default: '10' },
    'images-only': { type: 'boolean', short: 'i', default: false },
  },
  allowPositionals: true,
});

const FORMAT = values.format.toLowerCase();
const CROP = values.crop;
const THRESHOLD = parseInt(values.threshold, 10);
const IMAGES_ONLY = values['images-only'];
const IMAGES_DIR = path.resolve(positionals[0] || __dirname);

if (!['png', 'jpg'].includes(FORMAT)) {
  console.error('포맷 오류: --format png 또는 --format jpg 만 지정 가능');
  process.exit(1);
}

if (IMAGES_ONLY && !CROP) {
  console.error('오류: --images-only 는 --crop 과 함께 사용해야 합니다');
  process.exit(1);
}

let sharp;
if (CROP) {
  try {
    sharp = require('sharp');
  } catch {
    console.error('오류: --crop 사용 시 sharp 설치 필요 → npm install sharp');
    process.exit(1);
  }
}

// --- 이미지만 crop ---
async function cropImages() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(png|jpe?g)$/i.test(f));
  if (files.length === 0) { console.log('이미지 파일 없음 (PNG/JPG): ' + IMAGES_DIR); return; }

  console.log(`crop 시작: ${files.length}개 (threshold=${THRESHOLD}) (${IMAGES_DIR})`);
  for (const file of files) {
    const fp = path.join(IMAGES_DIR, file);
    const ext = path.extname(file);
    const tmp = fp + '.tmp' + ext;
    try {
      const info = await sharp(fp).trim({ threshold: THRESHOLD }).toFile(tmp);
      fs.renameSync(tmp, fp);
      console.log(`OK  ${file}  →  ${info.width}x${info.height}`);
    } catch (e) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      console.error(`ERR ${file}  ${e.message}`);
    }
  }
  console.log(`\n완료: ${files.length}개 crop 저장`);
}

// --- HTML 변환 ---
async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.html'));
  if (files.length === 0) { console.log('HTML 파일 없음: ' + IMAGES_DIR); return; }

  const cropLabel = CROP ? ` + crop(threshold=${THRESHOLD})` : '';
  console.log(`변환 시작: ${files.length}개 → ${FORMAT.toUpperCase()}${cropLabel} (${IMAGES_DIR})`);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const file of files) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

    const filePath = path.join(IMAGES_DIR, file);
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 300));

    const ext = FORMAT === 'jpg' ? '.jpg' : '.png';
    const outFile = path.join(IMAGES_DIR, file.replace('.html', ext));
    const screenshotOpts = FORMAT === 'jpg'
      ? { path: outFile, fullPage: true, type: 'jpeg', quality: 92 }
      : { path: outFile, fullPage: true, type: 'png' };

    await page.screenshot(screenshotOpts);
    await page.close();

    if (CROP) {
      const tmpFile = outFile + '.tmp' + ext;
      await sharp(outFile)
        .trim({ threshold: THRESHOLD })
        .toFile(tmpFile);
      fs.renameSync(tmpFile, outFile);
    }

    console.log(`OK  ${file}`);
  }

  await browser.close();
  console.log(`\n완료: ${files.length}개 ${FORMAT.toUpperCase()} 저장`);
}

(IMAGES_ONLY ? cropImages() : main()).catch(err => { console.error(err); process.exit(1); });
