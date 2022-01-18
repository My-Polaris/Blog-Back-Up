# 博客备份

心血来潮的我想要在博客上建立一个相册，此项目就是用于完成此功能。

项目中通过运行tool.py开始工作，首先会采用裁剪算法对/photos下的文件进行正方形裁剪，接着采用图片压缩算法对图片进行压缩并放置于min_photos文件夹中，此过程用于生成对应缩略图。

接着自动将该项目提交至远程仓库(即此处)，再生成相应的json格式数据传至博客目录的相册source/photos下，此过程用于更新博客的相册界面。

**总结来说，此项目用于为我的博客提供相册图片源，同时包含用Python编写的图片处理程序。**