
"use strict"
 
var _ = require("underscore");
var {nlpMoment}=require("./parse/nlpMoment.js");
var {food,sign,sport,behavior} = require("./parse/nlpHealth.js")

var express = require('express');
var multer = require("multer");
var utils = require("./utils.js");
var app = express();
var bodyParse = require('body-parser');
var fs = require("fs")
var http = require("http")
//var https = require("https")

//var privateKey= fs.readFileSync('3448266_youht.cc.key','utf8')
//var certKey = fs.readFileSync('3448266_youht.cc.pem','utf8')
//var cerd={key:privateKey,cert:certKey}

var httpServer = http.createServer(app)
//var httpsServer = https.createServer(cerd,app) 

httpServer.listen(6001,function(){
  console.log("httpServer listen on 6001")
})
//httpsServer.listen(6001,function(){
//  console.log("httpsServer listen on 6001")
//})


var ipfs,db
var start = async ()=>{
  //ipfs = await utils.ipfs.init("/dns4/ipfs1/tcp/5001")
  //ipfs = await utils.ipfs.init("/ip4/120.27.137.222/tcp/5001")
  //await utils.db.init("mongo:27017/food")
  ipfs = await utils.ipfs.init("/ip4/127.0.0.1/tcp/15081")
  //ipfs = await utils.ipfs.init("/ip4/120.27.137.222/tcp/5001")
  await utils.db.init("127.0.0.1:27017/food")
  
  db = utils.db
}
start()
.then(x=>{
  console.log("ipfs has been connected.")
  console.log("db has been connected.")
  food.registerDB(db)
})
.catch(err=>{
  console.log(err)
  process.exit(-1)
})
// 设置图片存储路径
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './temp');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})
 
// 添加配置文件到muler对象。
//storage:storage 将指定存储位置，null的话表示存到内存
var upload = multer({ storage: null  });  
var imgBaseUrl = '../'
 
// bodyParse 用来解析post数据
app.use(bodyParse.urlencoded({extended:false}));
app.use(bodyParse.json())
app.use(express.static('public'));
 
// 解决跨域问题
app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
 
  if (req.method == 'OPTIONS') {
    res.send(200); /让options请求快速返回/
  }
  else {
    next();
  }
});
 
// 文件上传请求处理，upload.array 支持多文件上传，第二个参数是上传文件数目
app.post('/img/upload', upload.single('img'), async function (req, res) {
  // 读取上传的图片信息
  var file = req.file;
  // 设置返回结果
  var result = {};
  if(!file) {
    result.code = 1;
    result.errMsg = '上传失败';
    res.end(JSON.stringify(result));
  } else {
    ipfs.add(file).then(cids=>{
      result = {code:0,
              hash:cids[0],
              errMsg:'上传成功'
      }
      res.end(JSON.stringify(result));
    })
  }
});
app.get('/img/download/:cid',async function(req,res){
  var cid = req.params.cid
  ipfs.cat(cid).then(content=>{
    let result = JSON.parse(content.toString())
    if (result.mimetype=='video/quicktime'){
      var fileName = "./temp"+result.originalname
      fileName="abc.mov"
      console.log(fileName)
      fs.writeFileSync(fileName, Buffer.from(result.buffer),'binary')
      res.writeHead(200, "Ok");
      res.end(`<html>
               <h1>hello</h1>
               <video src="${fileName}" controls="controls" type="video/quicktime"> 
                  您的浏览器不支持 video 标签。
               </video>
               </html>`)
      return 
    }else{
      console.log(result.buffer.size)
      res.writeHead(200, "Ok");
      res.write(new Buffer(result.buffer),"binary"); //格式必须为 binary，否则会出错
      res.end();
    }
  })
})

app.get("/food/:code/:value/:unit",async function(req,res){
  let code = req.params.code
  let value = parseFloat(req.params.value)
  let unit  = req.params.unit
  db.findOne("food",{"code":code}).then((item)=>{
    console.log(code,unit,item)
    if (!item) {
      res.json({})
      return 
    }
    let temp = item.unit.filter(x=>x.name.split("/").includes(unit))[0]
    let unitValue
    if (temp) unitValue=temp.value
    if (!temp) {
      temp="*"
      unitValue=item.unit[0].value
    }
    if (!unitValue || !temp) {
      res.json(item)
      return
    }
    switch (item.type){
    default:     
      for (let i in item.nutrition){
        item.nutrition[i][0]=parseInt(item.nutrition[i][0]/100*unitValue*value*100)/100
        item.nutrition[i][1]=parseInt(item.nutrition[i][1]/100*unitValue*value*100)/100
      }
      console.log(item)
    }
    if (Array.isArray(item.name)) item.name=item.name[0]
    res.json(item)
  })  
  .catch(e=>{
    console.log(e)
    res.json({})
  })
})

app.get("/food/id/:code",async function(req,res){
  let code  = req.params.code
  db.findOne("food",{"code":code}).then((item)=>{
    res.json(item)
  })  
})

app.get("/food/:name",async function(req,res){
  let name  = req.params.name
  console.log("/food/name",name)
  db.findMany("food",{"name":{"$regex":name}}).then((item)=>{
    let result = item.map(x=>{
       return x.name+":"+x.code   
    })
    res.json(result)
  })  
})

/*
{
            title: {
                text: 'ECharts 入门示例'
            },
            tooltip: {},
            legend: {
                data:['销量']
            },
            xAxis: {
                data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
            },
            yAxis: {},
            series: [{
                name: '销量',
                type: 'bar',
                data: [5, 20, 36, 10, 10, 20]
            }]
        };
*/
app.post("/food/analyse/",(req,res)=>{
  let data = JSON.parse(req.body.data)
  console.log("data:",data)
  let date = req.body.date
  let options = []
  let option={}
  let energyKj=[],fatG=[],chG=[],proteinG=[],sodiumMg=[]
  //for (let item of data.result.list){
  if (!Array.isArray(data)) data=[data]
  for (let item of data){
    if (date == Object.keys(item)[0]){
      let eatValue= Object.values(item)[0].eat
      if (eatValue){
        for (let eatItem of eatValue){
          if (eatItem && eatItem.nutrition && eatItem.nutrition.energyKj){
            energyKj.push([eatItem.eTime,eatItem.nutrition.energyKj[0],eatItem.nutrition.energyKj[1]])
          }
          if (eatItem && eatItem.nutrition && eatItem.nutrition.proteinG){
            proteinG.push([eatItem.eTime,eatItem.nutrition.proteinG[0],eatItem.nutrition.proteinG[1]])
          }
          if (eatItem && eatItem.nutrition && eatItem.nutrition.fatG){
            fatG.push([eatItem.eTime,eatItem.nutrition.fatG[0],eatItem.nutrition.fatG[1]])
          }
          if (eatItem && eatItem.nutrition && eatItem.nutrition.chG){
            chG.push([eatItem.eTime,eatItem.nutrition.chG[0],eatItem.nutrition.chG[1]])
          }
          if (eatItem && eatItem.nutrition && eatItem.nutrition.sodiumMg){
            sodiumMg.push([eatItem.eTime,eatItem.nutrition.sodiumMg[0],eatItem.nutrition.sodiumMg[1]])
          }
        }
      }
    }
  }
  console.log("energyKj:",energyKj)
  let sumEnergyKj,overEnergyKj
  if (energyKj.length!=0){
    sumEnergyKj = energyKj.map(x=>x[1]).reduce((x,y)=>x+y)
    overEnergyKj = Math.round(energyKj.map(x=>x[2]).reduce((x,y)=>x+y)*100)
  }
  let sumProteinG,overProteinG
  if (proteinG.length!=0){
    sumProteinG = proteinG.map(x=>x[1]).reduce((x,y)=>x+y)
    overProteinG = Math.round(proteinG.map(x=>x[2]).reduce((x,y)=>x+y)*100)
  }
  let sumFatG,overFatG
  if (fatG.length!=0){
    sumFatG = fatG.map(x=>x[1]).reduce((x,y)=>x+y)
    overFatG = Math.round(fatG.map(x=>x[2]).reduce((x,y)=>x+y)*100)
  }
  let sumChG,overChG
  if (chG.length!=0){
    sumChG = chG.map(x=>x[1]).reduce((x,y)=>x+y)
    overChG = Math.round(chG.map(x=>x[2]).reduce((x,y)=>x+y)*100)
  }
  let sumSodiumMg,overSodiumMg 
  if (sodiumMg.length!=0){
    sumSodiumMg = sodiumMg.map(x=>x[1]).reduce((x,y)=>x+y)
    overSodiumMg = Math.round(sodiumMg.map(x=>x[2]).reduce((x,y)=>x+y)*100)
  }
  
  option={
    title: {text: '今日卡路里摄入情况',
            subtext:`${sumEnergyKj}千焦,NRV:${overEnergyKj}%`},
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
        data: energyKj.map(x=>x[0])
    },
    yAxis: {
      splitLine: {show: false}
    },
    series: [{
        name: '千焦',
        type: 'line',
        smooth: true,
        data: energyKj.map(x=>x[1])
    }]
  }
  options.push({name:"energy",width:"100%",height:"480px",option:option})
  option={
    title:{text: '今日营养摄入情况',
           subtext:`蛋白质${sumProteinG}克,NRV${overProteinG}%,脂肪${sumFatG}克,NRV${overFatG}%,碳水${sumChG}克,NRV:${overChG}%`
           },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
        data: fatG.map(x=>x[0]),
        type: 'category',
    },
    yAxis: {
      splitLine: {show: false}
    },
    legend: {
      data: ['蛋白质','脂肪', '碳水'],
    },
    series: [{
      name: '蛋白质',
      type: 'bar',
      stack: '总量',
      data: proteinG.map(x=>x[1]),
      label: {
        show: true,
        position: 'insideRight'
      },
    },{
      name: '脂肪',
      type: 'bar',
      stack: '总量',
      data: fatG.map(x=>x[1]),
      label: {
        show: true,
        position: 'insideRight'
      },
    },{
      name: '碳水',
      type: 'bar',
      stack: '总量',
      data: chG.map(x=>x[1]),
      label: {
        show: true,
        position: 'insideRight'
      },
    }]
  }
  options.push({name:"other",width:"100%",height:"480px",option:option})

  option={
    title: {text: '今日钠的摄入情况',
            subtext:`${sumSodiumMg}毫克,NRV:${overSodiumMg}%`},
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
        data: sodiumMg.map(x=>x[0])
    },
    yAxis: {
      splitLine: {show: false}
    },
    series: [{
        name: '钠',
        type: 'line',
        smooth: true,
        data: sodiumMg.map(x=>x[1])
    }]
  }
  options.push({name:"sodium",width:"100%",height:"480px",option:option})

  res.json(options)
})

app.post("/food/register",(req,res)=>{
  let code = req.body.code
  let name = req.body.name
  let type = req.body.type
  let energyKj = req.body.energyKj
  energyKj = energyKj.split(",").map(x=>parseFloat(x,4))
  let proteinG = req.body.proteinG
  proteinG = proteinG.split(",").map(x=>parseFloat(x,4))
  let fatG     = req.body.fatG
  fatG = fatG.split(",").map(x=>parseFloat(x,4))
  let chG      = req.body.chG
  chG = chG.split(",").map(x=>parseFloat(x,4))
  let NaMg     = req.body.NaMg
  NaMg = NaMg.split(",").map(x=>parseFloat(x,4))
  let unit     = req.body.unit
  unit=unit.split(",")
  unit=[{"name":unit[0],"value":parseFloat(unit[1],4)}]
  db.insertOne("food",
     {"code":code,
      "name":name,
      "type":type,
      "nutrition":{
        "energyKj":energyKj,
        "proteinG":proteinG,
        "fatG":fatG,
        "chG":chG,
        "NaMg":NaMg
      },
      "unit":unit
      }).then((item)=>{
    res.json(item)
  }).catch((err)=>{
    res.json(err)
  })  
})


app.post("/health/registerNutrition/:text",(req,res)=>{
  let text = req.params.text
  let nutrition = food.register(text)
  res.json(nutrition)
})
app.get("/moment/help/",(req,res)=>{
  let topic = req.params.topic
  let help = nlpMoment.help(topic)
  console.log(help)
  res.end(help)
})

app.get("/moment/parse/:text",(req,res)=>{
  let text = req.params.text
  text = text.replace(new RegExp("[ ，。]","g"),"")
  let date = nlpMoment.parseDuration(text)
  //let date = nlpMoment.parse(text)
  //res.json(date?nlpMoment.nowE8(date,"YYYY/MM/DD HH:mm:ss"):null)
  if (!date[0] && !date[1]){
    fs.appendFileSync("error.txt",nlpMoment.nowE8("YYYY-MM-DD HH:mm:ss")+"|"+text+"|\n")
  }
  res.json({"sDate":date[0]?nlpMoment.getDate(date[0],"YYYYMMDD"):null,
            "sTime":date[0]?nlpMoment.getTime(date[0],"HH:mm:ss"):null,
            "eDate":date[1]?nlpMoment.getDate(date[1],"YYYYMMDD"):null,
            "eTime":date[1]?nlpMoment.getTime(date[1],"HH:mm:ss"):null
            })
})
app.get("/health/parse/:text",async (req,res)=>{
  let text= req.params.text
  let temp,result={},result1,time,datetime
  let start,end
  text = text.replace(new RegExp("[ ，。]","g"),"")
  datetime = nlpMoment.parseDuration(text)
  start=datetime[0]?datetime[0]:null
  end = datetime[1]?datetime[1]:null
  console.log("******",start,end)
  console.log("@",nlpMoment.getTime(start,"HHmmss"))
  console.log("@",nlpMoment.getTime(end,"HHmmss"))
  temp = await food.parse(text,start,end)
  if (temp.eat) 
    result.eat=temp.eat
  
  temp = sign.parse(text,start,end)
  if (temp.sign_weightKg) result.sign_weightKg=temp.sign_weightKg
  if (temp.sign_heartRate) result.sign_heartRate=temp.sign_heartRate
  
  temp = sport.parse(text,start,end)
  if (temp.sport_steps) 
    result.sport_steps=temp.sport_steps
  
  temp = behavior.parse(text,start,end)
  if (temp.behavior_sleep) result.behavior_sleep=temp.behavior_sleep
  console.log("[result]:",result)
  res.json(result)
})

app.post("/menu/parse/",(req,res)=>{
  let menu = JSON.parse(req.body.menu)
  let result = food.menuRec(menu)
  res.json(result)
})

app.get("/wx/help/",(req,res)=>{
  let html=
  `
  <!DOCTYPE html>
<html>
<head>
<script src="https://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
<script type="text/javascript" src="https:/res.wx.qq.com/open/js/jweixin-1.3.2.js"/>
<script>
$(document).ready(function(){
  $("button").click(function(){
    console.log("abc")
    wx.miniProgram.navigateTo({url:"/pages/index/index"})
  });
});
</script>
</head>

<body>
<h2>这是一个标题</h2>
<p>这是一个段落。</p>
<p>这是另一个段落。</p>
<button>点我</button>
</body>
</html>
  `
  res.end(html)
})

app.get("/wx/mermaid/",(req,res)=>{
  let html=
`
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- 上述3个meta标签*必须*放在最前面，任何其他内容都*必须*跟随其后！ -->
  </head>
<body>
<script type="text/javascript" src="https:/res.wx.qq.com/open/js/jweixin-1.3.2.js"/>
<script src="https://cdn.jsdelivr.net/npm/mermaid@8.4.0/dist/mermaid.min.js"></script>
<script>
  var callback=function(node){
    document.write(node)
  }
  mermaid.initialize({startOnLoad:true,securityLevel:"loose"});
</script>

Here is one mermaid diagram:
<div class="mermaid">
graph TD
A[Client] --> B[Load Balancer]
B --> C[Server1]
B --> D[Server2]
click A callback "Tooltip"
click B callback "sample"
click C callback "hello"
</div>

And here is another:
<div class="mermaid">
graph TD
A[Client] -->|tcp_123| B(Load Balancer)
B -->|tcp_456| C[Server1]
B -->|tcp_456| D[Server2]
</div>
And the last graph:
<div class="mermaid">
graph TB
    sq[Square shape] --> ci((Circle shape))
    subgraph A subgraph
        di{Diamond with  line break} -.-> ro(Rounded)
        di==>ro2(Rounded square shape)
    end
    e --> od3>Really long text with linebreakin an Odd shape]
    cyr[Cyrillic]-->cyr2((Circle shape 圆圈));
    classDef green fill:#9f6,stroke:#333,stroke-width:2px;
    classDef orange fill:#f96,stroke:#333,stroke-width:4px;
    classDef default fill:#f96,stroke:#333,stroke-width:4px;
    linkStyle 0,4 stroke:red,stroke-width:4px;
    class sq,e green
    class di orange
</div>
<div id="test">
   <button id="btn">返回</button>
</div>
<script>
  var obj=document.getElementById("btn")
  obj.on("click")
    wx.miniProgram.navigateTo({url:"/pages/index/index"})
</script>
</body>
</html>
`
  res.end(html)
})

app.get("/benfordTest/:data",(req,res)=>{
   let data=req.params.data.split(",")
   let result = nlpMoment.benfordTest(data)
   res.send(`<pre>${JSON.stringify(result,null,4)}</pre>`)
})

// 监听5000端口
//var server=app.listen(5000, '0.0.0.0', function () {
//  console.log('listening at =====> http://0.0.0.0:5000......');
//}) ;

