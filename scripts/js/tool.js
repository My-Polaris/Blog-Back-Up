const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Graphics = require('./imageProcess');

// 定义压缩比，数值越大，压缩越小
const SIZE_NORMAL = 1.0;
const SIZE_SMALL = 1.5;
const SIZE_MORE_SMALL = 2.0;
const SIZE_MORE_SMALL_SMALL = 3.0;

/**
 * 创建目录
 * @param {string} directory - 目录路径
 */
function makeDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

/**
 * 判断目录是否存在
 * @param {string} directory - 目录路径
 * @returns {boolean}
 */
function directoryExists(directory) {
  return fs.existsSync(directory);
}

/**
 * 列出目录下所有图片文件
 * @param {string} directory - 目录路径
 * @returns {string[]} 图片文件列表
 */
function listImgFile(directory) {
  const oldList = fs.readdirSync(directory);
  const newList = [];
  
  for (const filename of oldList) {
    const parts = filename.split('.');
    if (parts.length < 2) continue;
    
    const fileformat = parts[parts.length - 1].toLowerCase();
    if (fileformat === 'jpg' || fileformat === 'png' || fileformat === 'gif') {
      newList.push(filename);
    }
  }
  
  return newList;
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
    This program helps compress many image files
    you can choose which scale you want to compress your img(jpg/png/etc)
    1) normal compress(4M to 1M around)
    2) small compress(4M to 500K around)
    3) smaller compress(4M to 300K around)
    4) smallest compress(4M to 200K around)
  `);
}

/**
 * 压缩图片
 * @param {string} choose - 压缩级别选择
 * @param {string} desDir - 目标目录
 * @param {string} srcDir - 源目录
 * @param {string[]} fileList - 文件列表
 */
async function compress(choose, desDir, srcDir, fileList) {
  let scale;
  switch (choose) {
    case '1':
      scale = SIZE_NORMAL;
      break;
    case '2':
      scale = SIZE_SMALL;
      break;
    case '3':
      scale = SIZE_MORE_SMALL;
      break;
    case '4':
      scale = SIZE_MORE_SMALL_SMALL;
      break;
    default:
      scale = SIZE_MORE_SMALL_SMALL;
  }

  for (const infile of fileList) {
    try {
      const metadata = await sharp(path.join(srcDir, infile)).metadata();
      const { width: w, height: h } = metadata;
      
      const newWidth = Math.round(w / scale);
      const newHeight = Math.round(h / scale);
      
      await sharp(path.join(srcDir, infile))
        .resize(newWidth, newHeight, {
          fit: 'inside',  // 保持宽高比，类似 PIL 的 thumbnail
          withoutEnlargement: true
        })
        .toFile(path.join(desDir, infile));
      
      console.log(`已压缩: ${infile}`);
    } catch (error) {
      console.error(`压缩失败 ${infile}: ${error.message}`);
    }
  }
}

/**
 * 调用压缩图片的函数
 */
async function compressPhoto() {
  const srcDir = path.resolve(__dirname, '../../source/photos/');
  const desDir = path.resolve(__dirname, '../../source/min_photos/');

  if (!directoryExists(srcDir)) {
    console.log('源目录不存在！');
    return;
  }

  if (!directoryExists(desDir)) {
    makeDirectory(desDir);
  }

  const fileListSrc = listImgFile(srcDir);
  const fileListDes = directoryExists(desDir) ? listImgFile(desDir) : [];

  // 如果已经压缩了，就不再压缩
  const filesToCompress = fileListSrc.filter(file => !fileListDes.includes(file));

  if (filesToCompress.length === 0) {
    console.log('=====没有新文件需要压缩=======');
    return;
  }

  await compress('4', desDir, srcDir, filesToCompress);
}

/**
 * 根据图片的文件名处理成需要的json格式的数据
 * 最后将data.json文件存到博客的source/photos文件夹下
 */
async function handlePhoto() {
  const srcDir = path.resolve(__dirname, '../../source/photos/');
  const desDir = path.resolve(__dirname, '../../source/min_photos/');
  
  if (!directoryExists(srcDir)) {
    console.log('源目录不存在！');
    return;
  }

  const fileList = listImgFile(srcDir);
  const listInfo = [];

  // 按照日期排序
  fileList.sort((a, b) => {
    const dateA = a.split('_')[0];
    const dateB = b.split('_')[0];
    return dateA.localeCompare(dateB);
  });

  for (let i = 0; i < fileList.length; i++) {
    const filename = fileList[i];
    const parts = filename.split('_');
    if (parts.length < 2) continue;

    const dateStr = parts[0];
    const infoPart = parts[1].split('.')[0];
    
    const date = new Date(dateStr);
    const yearMonth = dateStr.substring(0, 7);

    if (i === 0) {
      // 处理第一个文件
      const newDict = {
        date: yearMonth,
        arr: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          link: [filename],
          text: [infoPart],
          type: ['image']
        }
      };
      listInfo.push(newDict);
    } else if (yearMonth !== listInfo[listInfo.length - 1].date) {
      // 不是最后的一个日期，就新建一个dict
      const newDict = {
        date: yearMonth,
        arr: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          link: [filename],
          text: [infoPart],
          type: ['image']
        }
      };
      listInfo.push(newDict);
    } else {
      // 同一个日期
      listInfo[listInfo.length - 1].arr.link.push(filename);
      listInfo[listInfo.length - 1].arr.text.push(infoPart);
      listInfo[listInfo.length - 1].arr.type.push('image');
    }
  }

  // 翻转
  listInfo.reverse();
  const finalDict = { list: listInfo };

  // 注意：需要根据实际情况修改输出路径
  const outputPath = path.resolve(__dirname, '../../../source/photos/data.json');
  const outputDir = path.dirname(outputPath);
  
  if (!directoryExists(outputDir)) {
    makeDirectory(outputDir);
  }

  fs.writeFileSync(outputPath, JSON.stringify(finalDict, null, 2), 'utf8');
  console.log(`已生成 data.json 到 ${outputPath}`);
}

/**
 * 裁剪照片为正方形
 * 调用Graphics类中的裁剪算法，将src_dir目录下的文件进行裁剪（裁剪成正方形）
 */
async function cutPhoto() {
  const srcDir = path.resolve(__dirname, '../../source/photos/');

  if (!directoryExists(srcDir)) {
    console.log('源目录不存在！');
    return;
  }

  const fileList = listImgFile(srcDir);
  
  if (fileList.length === 0) {
    console.log('没有图片文件需要裁剪');
    return;
  }

  printHelp();
  
  for (const infile of fileList) {
    try {
      const filePath = path.join(srcDir, infile);
      const graphics = new Graphics(filePath, filePath);
      await graphics.cutByRatio();
      console.log(`已裁剪: ${infile}`);
    } catch (error) {
      console.error(`裁剪失败 ${infile}: ${error.message}`);
    }
  }
}

/**
 * Git 命令行函数，将仓库提交
 * 需要安装git命令行工具，并且添加到环境变量中
 */
function gitOperation() {
  try {
    console.log('开始执行 git 操作...');
    
    // 只添加照片相关的文件
    const photosDir = path.resolve(__dirname, '../../source/photos/');
    const minPhotosDir = path.resolve(__dirname, '../../source/min_photos/');
    
    execSync(`git add "${photosDir}"`, { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
    execSync(`git add "${minPhotosDir}"`, { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
    
    // 检查是否有变更需要提交
    const status = execSync('git status --porcelain', { cwd: path.resolve(__dirname, '../../') }).toString();
    
    if (!status.trim()) {
      console.log('没有需要提交的变更');
      return;
    }
    
    execSync('git commit -m "add photos"', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
    execSync('git push origin master', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
    console.log('Git 操作完成！');
  } catch (error) {
    console.error(`Git 操作失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await cutPhoto();        // 裁剪图片，裁剪成正方形，去中间部分
    await compressPhoto();   // 压缩图片，并保存到min_photos文件夹下
    gitOperation();          // 提交到github仓库
    await handlePhoto();     // 将文件处理成json格式，存到博客仓库中
    
    console.log('所有操作完成！');
  } catch (error) {
    console.error(`执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  makeDirectory,
  directoryExists,
  listImgFile,
  compress,
  compressPhoto,
  handlePhoto,
  cutPhoto,
  gitOperation
};
