const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * 图片处理类
 * 
 * @class Graphics
 * @param {string} infile - 输入文件路径
 * @param {string} outfile - 输出文件路径
 */
class Graphics {
  constructor(infile, outfile) {
    this.infile = infile;
    this.outfile = outfile;
  }

  /**
   * 按照固定尺寸处理图片
   * 
   * @param {number} width - 目标宽度
   * @param {number} height - 目标高度
   */
  async fixedSize(width, height) {
    try {
      await sharp(this.infile)
        .resize(width, height, {
          fit: 'fill'
        })
        .toFile(this.outfile);
    } catch (error) {
      throw new Error(`固定尺寸处理失败: ${error.message}`);
    }
  }

  /**
   * 按照宽度进行所需比例缩放
   * 
   * @param {number} wDivideH - 宽高比
   */
  async resizeByWidth(wDivideH) {
    try {
      const metadata = await sharp(this.infile).metadata();
      const xS = metadata.width;
      const yS = Math.round(xS / wDivideH);
      
      await sharp(this.infile)
        .resize(xS, yS, {
          fit: 'fill'
        })
        .toFile(this.outfile);
    } catch (error) {
      throw new Error(`按宽度缩放失败: ${error.message}`);
    }
  }

  /**
   * 按照高度进行所需比例缩放
   * 
   * @param {number} wDivideH - 宽高比
   */
  async resizeByHeight(wDivideH) {
    try {
      const metadata = await sharp(this.infile).metadata();
      const yS = metadata.height;
      const xS = Math.round(yS * wDivideH);
      
      await sharp(this.infile)
        .resize(xS, yS, {
          fit: 'fill'
        })
        .toFile(this.outfile);
    } catch (error) {
      throw new Error(`按高度缩放失败: ${error.message}`);
    }
  }

  /**
   * 按照生成图片文件大小进行处理(单位KB)
   * 
   * @param {number} size - 目标文件大小(KB)
   */
  async resizeBySize(size) {
    try {
      const targetSize = size * 1024;
      const stats = fs.statSync(this.infile);
      let sizeTmp = stats.size;
      let q = 100;

      // 如果原始文件已经小于目标大小，直接复制
      if (sizeTmp <= targetSize) {
        fs.copyFileSync(this.infile, this.outfile);
        return;
      }

      // 逐步降低质量直到满足大小要求
      while (sizeTmp > targetSize && q > 0) {
        console.log(`当前质量: ${q}`);
        
        await sharp(this.infile)
          .jpeg({ quality: q })
          .toFile(this.outfile);
        
        const outStats = fs.statSync(this.outfile);
        sizeTmp = outStats.size;
        q -= 5;
      }
    } catch (error) {
      throw new Error(`按大小压缩失败: ${error.message}`);
    }
  }

  /**
   * 按照图片长宽进行分割
   * 取中间的部分，裁剪成正方形
   */
  async cutByRatio() {
    try {
      const metadata = await sharp(this.infile).metadata();
      const { width: x, height: y } = metadata;

      let region;
      if (x > y) {
        // 宽度大于高度，从中间裁剪
        region = {
          left: Math.floor(x / 2 - y / 2),
          top: 0,
          width: y,
          height: y
        };
      } else if (x < y) {
        // 高度大于宽度，从中间裁剪
        region = {
          left: 0,
          top: Math.floor(y / 2 - x / 2),
          width: x,
          height: x
        };
      } else {
        // 已经是正方形，直接复制
        fs.copyFileSync(this.infile, this.outfile);
        return;
      }

      await sharp(this.infile)
        .extract(region)
        .toFile(this.outfile);
    } catch (error) {
      throw new Error(`裁剪正方形失败: ${error.message}`);
    }
  }
}

module.exports = Graphics;
