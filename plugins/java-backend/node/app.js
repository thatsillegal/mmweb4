const Koa = require('koa');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');    //将函数promise化
const stat = promisify(fs.stat);    //用来获取文件的信息
const mime = require('mime');   //mime类型获取插件
const app = new Koa();


const http = require('http').createServer(app.callback());

function static(dir) {
  return async (ctx, next) => {
    let pathname = ctx.path;
    let realPath = path.join(dir, pathname);
    
    try {
      let statObj = await stat(realPath);
      if (statObj.isFile()) {
        ctx.set('Content-Type', mime.getType(realPath) + ";charset=utf-8");
        ctx.body = fs.createReadStream(realPath)
      } else {
        //如果不是文件，则判断是否存在index.html
        let filename = path.join(realPath, 'index.html')
        await stat(filename)
        ctx.set('Content-Type', "text/html;charset=utf-8");
        ctx.body = fs.createReadStream(filename);
      }
    } catch (e) {
      await next();   //交给后面的中间件处理
    }
  }
}

app.use(static(__dirname));


const date = new Date();
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


io.on('connection', (socket) => {
  console.info(date.toLocaleString(), `Client connected [id=${socket.id}]`);
  socket.on('disconnect', async function () {
    console.info(date.toLocaleString(), `Client [id=${socket.id}] disconnect :)`);
  });
  
  socket.on('bts:sendGeometry', async function (data) {
    console.log(date.toLocaleString(), 'bts:sendGeometry: ' + data);
    data.id = socket.id;
  
    console.log('bts:' + data.app + 'ReceiveGeometry')
    io.emit('bts:' + data.app + 'ReceiveGeometry', data);
  
  });
  
  socket.on('stb:sendGeometry', async function (data) {
    data = JSON.parse(data);
    console.log(date.toLocaleString(), 'stb:sendGeometry');
    io.to(data.id).emit('stb:receiveGeometry', data.geometryElements);
  });
});

http.listen(27781, () => {
  console.log("listening on *:27781")
});
