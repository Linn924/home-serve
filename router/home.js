const Router = require("koa-router")
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const Mysql = require('promise-mysql2')
const mysql = require("../mysql.js")

const home = new Router() //路由

//获取壁纸
home.get('/wallpapers',async ctx => {
    const username = ctx.request.query.uname
    const id = ctx.request.query.uid

    const connection = await Mysql.createConnection(mysql)
    const [res] = await connection.query('SELECT * FROM default_wallpaper')
    if(username && id){
        const sql = `SELECT default_wallpaper,custom_wallpaper 
                    FROM user WHERE username='${username}' and id=${id}`
        var [res2] = await connection.query(sql)
    }
    connection.end((err) => console.log(err))

    if(res.length >= 0 && !username){
        ctx.body = {
            data:res,
            code:200,
            tips:'查询成功'
        }
    }else if(res.length >= 0 && username){
        ctx.body = {
            data:res,
            defaultImg:res2[0].default_wallpaper,
            customImg:res2[0].custom_wallpaper,
            code:200,
            tips:'查询成功'
        }
    }else{
        ctx.body = {
            code:400,
            tips:'查询失败'
        }
    }
})

//上传壁纸
home.post('/wallpapers', async ctx =>{
    const file = ctx.request.files.image
    const username = ctx.request.body.uname.trim()
    const id = ctx.request.body.uid

    const wallpaperName = ctx.request.body.wallpaper.split('/').reverse()[0]
    const wallpaperPath = path.join(__dirname , "../wallpaper/") + wallpaperName
    fs.access(wallpaperPath,async err => {
        if(!err)
        await fs.unlink(wallpaperPath.trim(), (err) => { if (err) throw err })  
    })

    const reader = fs.createReadStream(file.path) 
    const name = username + (new Date()).getTime() + ".png"
    const filePath = path.join(__dirname , "../wallpaper/") + name
    const upStream = fs.createWriteStream(filePath) 
    reader.pipe(upStream)

    const connection = await Mysql.createConnection(mysql)
    const url = `http://139.196.210.43:0927/images/${name}`
    const sql = `UPDATE user set default_wallpaper='${url}',custom_wallpaper='${url}' 
                WHERE username='${username}' and id=${id}`
    const [res] = await connection.query(sql)

    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'上传壁纸成功'
        }
    } else {
        ctx.body = {
            code:400,
            tips:'上传壁纸失败'
        }
    }
})

//修改壁纸
home.put('/wallpapers',async ctx => {
    const url = ctx.request.body.url
    const username = ctx.request.body.uname
    const id = ctx.request.body.uid

    const connection = await Mysql.createConnection(mysql)
    const sql = `UPDATE user set default_wallpaper='${url}' 
                WHERE username='${username}' and id=${id}`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'修改成功'
        }
    } else {
        ctx.body = {
            code:400,
            tips:'修改失败'
        }
    }
})

//查询图片
home.get('/images/:name', async ctx =>{
    const name = ctx.params.name
    const filePath = path.join(__dirname, `../wallpaper/${name}`)
    const file = fs.readFileSync(filePath)
    let mimeType = mime.lookup(filePath)
	ctx.set('content-type', mimeType)
    ctx.body = file	
})

//获取网站
home.get('/websites',async ctx => {
    const uname = ctx.request.query.uname
    const uid = ctx.request.query.uid

    const connection = await Mysql.createConnection(mysql)
    const [res] = await connection.query(`SELECT * FROM default_nav`)
    if(uname && uid){
        const sql = `SELECT * FROM custom_nav WHERE uname='${uname}' and uid=${uid}`
        var [res2] = await connection.query(sql)
    }
    connection.end((err) => console.log(err))
   
    if(res.length > 0 && !uname && !uid){
        ctx.body = {
            data:res,
            code:200,
            tips:'查询成功'
        }
    }else if(res.length > 0 && res2.length >= 0 && uname && uid){
        ctx.body = {
            data:res.concat(res2),
            code:200,
            tips:'查询成功'
        }
    }else{
        ctx.body = {
            code:400,
            tips:'查询失败'
        }
    }
})

//添加自定义网站
home.post('/websites',async ctx => {
    const uid = ctx.request.body.uid
    const uname = ctx.request.body.uname.trim()
    const title = ctx.request.body.title.trim()
    const url = ctx.request.body.url.trim()
    let logo = url.split('//').reverse()[0]
    if(logo.includes('/')){
        logo = 'https://api.iowen.cn/favicon/' + logo.split('/')[0] + '.png'
    }else{
        logo = 'https://api.iowen.cn/favicon/' + logo + '.png'
    }

    const connection = await Mysql.createConnection(mysql)
    const sql = `INSERT INTO custom_nav (uid,uname,logo,title,url) VALUE
                 (${uid}, '${uname}', '${logo}','${title}','${url}')`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'添加成功'
        }
    } else {
        ctx.body = {
            code:400,
            tips:'添加失败'
        }
    }
    
})

//修改自定义网站
home.put('/websites',async ctx => {
    const id = ctx.request.body.id
    const uname = ctx.request.body.uname.trim()
    const title = ctx.request.body.title.trim()
    const url = ctx.request.body.url.trim()

    const connection = await Mysql.createConnection(mysql)
    const sql = `UPDATE custom_nav set title='${title}',url='${url}' WHERE id=${id} and uname='${uname}'`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'修改成功'
        }
    } else {
        ctx.body = {
            code:400,
            tips:'修改失败'
        }
    }
})

//删除自定义网站
home.delete('/websites',async ctx => {
    const id = ctx.request.query.id
    const uname = ctx.request.query.uname

    const connection = await Mysql.createConnection(mysql)
    const sql = `DELETE FROM custom_nav WHERE id = ${id} and uname = '${uname}'`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))
    
    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'删除成功'
        }
    } else {
        ctx.body = {
            code:400,
            tips:'删除失败'
        }
    }
})

module.exports = home