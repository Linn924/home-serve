const Router = require("koa-router")
const Md5 = require("md5")
const jwt = require("jsonwebtoken")
const Mysql = require('promise-mysql2')
const mysql = require("../mysql.js")

const user = new Router() //路由

//登录
user.get('/users',async ctx => {
    const username = ctx.request.query.username.trim()
    const password = Md5(ctx.request.query.password.trim())
    const userdata = {name: username,pwd: password}
    const secret = "LinnCooper"

    const connection = await Mysql.createConnection(mysql)
    const sql = `SELECT * FROM user where username = '${username}' and password= '${password}'`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if (res.length > 0) {
        ctx.body = {
            code:200,
            tips:'登录成功',
            uname:res[0].username,
            uid:res[0].id,
            token:jwt.sign(userdata, secret)
        }
    } else {
        ctx.body = {
            code:400,
            tips:'登录失败',
        }
        
    }
})

//验证用户名
user.get('/checkName',async ctx => {
    const username = ctx.request.query.username.trim()
    const status = ctx.request.query.status.trim()

    if(username.length == 0){
        ctx.body = {
            code:400,
            tips:'请输入昵称'
        }
    }else if(username.length < 2){
        ctx.body = {
            code:400,
            tips:'昵称不能少于两位'
        }
    }else if(username.length > 10){
        ctx.body = {
            code:400,
            tips:'昵称超出限制'
        }
    }else{
        const connection = await Mysql.createConnection(mysql)
        const [res] = await connection.query(`SELECT * FROM user`)
        connection.end((err) => console.log(err))

        let flag = res.some(item => {
            if (item.username === username) {
                if(status === '注册'){
                    ctx.body = {
                        code:400,
                        tips:'昵称已经被注册'
                    }
                }else{
                    ctx.body = {
                        code:400,
                        tips:'未作出任何修改'
                    }  
                }
                return true
            }
        })

        if(!flag){
            ctx.body = {
                code:200,
                tips:'昵称可用~'
            }
        }
    }
})

//验证用户身份
user.get('/checkIdentity',async ctx => {
    const username = ctx.request.query.username.trim()
    const email = ctx.request.query.email.trim()

    const connection = await Mysql.createConnection(mysql)
    const sql = `SELECT * FROM user WHERE username='${username}' and email='${email}'`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if(res.length === 1){
        ctx.body = {
            code:200,
            tips:'身份验证成功',
        }
    }else{
        ctx.body = {
            code:400,
            tips:'身份验证失败',
        }
    }
})

//注册
user.post('/users',async ctx => {
    const username = ctx.request.body.username.trim()
    const password = Md5(ctx.request.body.password.trim())
    const email = ctx.request.body.email.trim()
    const default_wallpaper = 'http://139.196.210.43:0927/static/images/1.jpg'
    const custom_wallpaper = ''

    const connection = await Mysql.createConnection(mysql)
    const sql = `INSERT INTO user (username,password,email,default_wallpaper,custom_wallpaper)
                 VALUE('${username}', '${password}', '${email}','${default_wallpaper}','${custom_wallpaper}')`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'注册成功',
        }
    } else {
        ctx.body = {
            code:400,
            tips:'注册失败',
        }
    }
})

//修改用户密码
user.put('/password',async ctx => {
    const username = ctx.request.body.username.trim()
    const password = Md5(ctx.request.body.password.trim())

    const connection = await Mysql.createConnection(mysql)
    const sql = `UPDATE user SET password='${password}' WHERE username='${username}'`
    const [res] = await connection.query(sql)
    connection.end((err) => console.log(err))

    if (res.affectedRows > 0) {
        ctx.body = {
            code:200,
            tips:'密码重置成功',
        }
    } else {
        ctx.body = {
            code:400,
            tips:'密码重置失败',
        }
    }
})
module.exports = user