const Base = require("./nlpBase.js").Base
const TextRec = require("./baiduAI.js").TextRec
class Food extends Base{
  constructor(){
    super()
    this.act=`(?<=还有|吃的是|早餐是|午餐是|晚餐是|吃了|喝了|抽了|吸了)[，]?`
    this.liangci=`个|瓶|杯|碗|盒|袋|箱|桶|份|盘|根|支|包|罐|颗|粒|块|张|勺|汤匙|顿|片|毫升|口|代|大碗|大盘|大瓶`
    this.eat=`(${this.shuciA}+)?(${this.liangci})?(.+)`
    this.convTb={"克":{"克":1,"匙":10,"大匙":15,"小匙":5,"少许":5,"适量":10}}

  }
  convert(fromValue,fromUnit,toUnit){
    if (!this.convTb) return null
    let temp = this.convTb[toUnit] 
    return  temp && temp[fromUnit]*fromValue
  }
  menuRec(menu,zhuliao ="原料",fuliao="调料"){
    let textRec = new TextRec(menu)
    let index=textRec.maxRight([zhuliao,fuliao])
    textRec.exclude(index,{left:10,right:10})
    //let nameObj = textRec.findTitle()
    //console.log("title",nameObj)
    //textRec.exclude(nameObj.idx,{top:0})
    //return {"result":textRec.words}
    let bName=false,bMenu=false,bMethod=false
    let name="",method="",lastMethodIdx=null
    let text,things=[]
    textRec.words.map((x,i,s)=>{
      if (x.words.match(new RegExp(zhuliao))) {
        name=textRec.findNearTop(i)[0]
        console.log("findNearTop",textRec.findNearTop(i),name)        
        bMenu=true
      }
      if (x.words.match(/做法/)) {
        bMenu=false;
        bMethod=true
        lastMethodIdx=i
      }
      if (bMethod){
        if (textRec.isSameParam(i,lastMethodIdx)){
          method=method+x.words  
        }else{
          bMethod=false
          lastMethodIdx=null
        }
      }
      if (bMenu){
        things.push(x.words)
      }
    })
    text=things.join("")
    
    text=this.replace(text,["：","；","，","。","、","（","）","／"],[":",";",",",".","|","(",")","/"])
    text=this.remove(text,[zhuliao,fuliao,"■"])
    //reg=new RegExp(`[:,\\.]+([^\\d^各]+)((各)?\\d\\./]+)(匙|大匙|小匙|少许|适量|克|个|毫升)`,"g")
    let reg=new RegExp(`[:,\\.]+(.+?)(匙|大匙|小匙|少许|适量|克|个|毫升)`,"g")
    let reg1=new RegExp(`([^\\d^\\.^/]+)(各|[\\d\\./]+)`)
    let result=[]
    //console.log(text)
    let seg1,seg2
    while (seg1=reg.exec(text)){
        let seg2=seg1[1].match(reg1)
        seg2[1].split(/[:\\|]/).map(x=>
            {return {"stuff":x,"value":seg2[2]=="各"?1:seg2[2],"unit":seg1[2]}}
        ).map(x=>{
          result.push({stuff:x.stuff,
                       value:this.convert(x.value,x.unit,"克"),
                       unit:"克"})
          //console.log(result)
        })
    }
    return {name:name,menu:result,method:method}
  }
  
  register(code,name,value,unit,text){
    let liangci = `克|毫克|微克|千焦|千卡`
    let value1,value2,value3
    let nrv
    let args=[
      {"name":"energyKj","reg":new RegExp(`(?<=能量)(${this.shuciA}).*(${this.shuciA})`)},
      {"name":"proteinG","reg":new RegExp(`(?<=蛋白质)(${this.shuciA}).*(${this.shuciA})`)},
      {"name":"fatG",    "reg":new RegExp(`(?<=脂肪)(${this.shuciA}).*(${this.shuciA})`)},
      {"name":"chG",    "reg":new RegExp(`(?<=碳水)(${this.shuciA}).*(${this.shuciA})`)},
             ]
    let nutrition={}
    for (let item of args){
      let match = text.match(item.reg)
      console.log(match)
      if (match) {
        value1=this.translateNum(match[1])
        value2=this.translateNum(match[2])
        value3=this.translateNum(match[3])
        value=value1
        nrv = Math.round(value3/value2*1000)/1000
        if (value && nrv) {
          nutrition[item.name]=[value,nrv]
        }
      }
    }
    return nutrition
  }
  //////
  async parseMultiFood(text,value,unit){
    let act=`煎|炸|炒|蒸|煮|溜|炖|焖|拌|红烧|干锅|清炒|清蒸`
    let result={},result1={},result2={}
    let stuffReg=new RegExp(`(.*)(${act})(.+)`)
    let stuff=text.match(stuffReg)
    if (stuff){
      //result={text:[stuff[1],stuff[2],stuff[3]]}
      if (stuff[1] && stuff[3]){
        result1  = await this.nutritionOfFood(stuff[1],value*0.5,unit)
        console.log("a",result1)
        result2  = await this.nutritionOfFood(stuff[3],value*0.5,unit)
        console.log("b",result2)
        for (let i in result1){
          result[i]=_.zip(result1[i],result2[i]).map(x=>{return x.reduce((m,n)=>m+n)})
        }
        console.log("ab",result)
      }else if (!stuff[1] && stuff[3]){
        result = await this.nutritionOfFood(stuff[3],value,unit)
        console.log("c",result)
      }
    }else{
      result=await this.nutritionOfFood(text,value,unit)
      console.log("d",result)
    }
    return result
  }
  
  async nutritionOfFood(name,value,unit){
    value = parseFloat(value)
    let result = await this.db.findOne("food",{"name":{"$regex":name}}).then((item)=>{
      if (!item) {
        return {}
      }
      let temp = item.unit.filter(x=>x.name.split("/").includes(unit))[0]
      let unitValue
      if (temp) unitValue=temp.value
      if (!temp) {
        temp="*"
        unitValue=100 //item.unit[0].value
      }
      if (!unitValue || !temp) {
        return item
      }
      switch (item.type){
      default:     
        for (let i in item.nutrition){
          item.nutrition[i][0]=Math.round(item.nutrition[i][0]/100*unitValue*value*100)/100
          item.nutrition[i][1]=Math.round(item.nutrition[i][1]/100*unitValue*value*100)/100
        }
      }
      console.log(item.code,item.name)
      return item.nutrition
    })  
    .catch(e=>{
      console.log(e)
      return {}
    })
    return result
  }
  //////////

  async parse(text,start,end){
    //饮食
    //吃了一个苹果和三个鸭梨
    let eatReg1=new RegExp(`${this.act}(${this.eat})(${this.join})(${this.eat})`)
    //吃了一个苹果
    let eatReg2=new RegExp(`${this.act}(${this.eat})`)

    let eat , result={}
    let value1,value2,unit1,unit2,stuff1,stuff2
    let nutrition1,nutrition2
    
    eat = text.match(eatReg1)

    console.log("1",eat)
    if (eat){
      value1 = this.flex2num([eat[3],eat[4],eat[5]])
      if (!value1){
        value1 = 1
      }
      unit1 = eat[6]
      stuff1 = eat[7]
      value2 =this.flex2num([eat[11],eat[12],eat[13]])
      if (!value2){
        value2=value1
      }
      unit2 =eat[14]
      if (!unit2){
        unit2=unit1
      }
      stuff2 = eat[15]
      
      nutrition1  = await this.parseMultiFood(stuff1,value1,unit1)
      nutrition2 = await  this.parseMultiFood(stuff2,value2,unit2)
      result.eat=[{"unit":unit1,
                    "value":value1,
                    "stuff":stuff1,
                    "nutrition":nutrition1,
                    "eDate":this.getDate(end),
                    "eTime":this.getTime(end)},
                   {"unit":unit2,
                    "value":value2,
                    "stuff":stuff2,
                    "nutrition":nutrition2,
                    "eDate":this.getDate(end),
                    "eTime":this.getTime(end)}]
      return result
    }
    
    eat = text.match(eatReg2)
    console.log("2",eat)
    if (eat){
      value1 = this.flex2num([eat[3],eat[4],eat[5]])
      console.log("2.value1",value1)
      unit1 = eat[6]
      stuff1 = eat[7]
      if (!value1){
        value1 = 1
      }
      nutrition1  = await this.parseMultiFood(stuff1,value1,unit1)
      console.log("2.nutrition1",nutrition1)
      result.eat=[{"unit":unit1,
                  "value":value1,
                  "stuff":stuff1,
                  "nutrition":nutrition1,
                  "eDate":this.getDate(end),
                  "eTime":this.getTime(end)}]
      console.log("2.result",result)
      return result
    }
    return result
  }
  /////
}
class Sign extends Base{
  constructor(){
    super()
    this.liangci = `克|千克|公斤|斤`
    this.convert={"克":1/1000,"千克":1,"公斤":1,"斤":0.5}
  }
  parse(text,start,end){
    let result={}
    let temp
    temp = this.parseHeartRate(text,end)
    if (temp) result.sign_heartRate = temp.sign_heartRate
    temp = this.parseWeight(text,start,end)
    if (temp) result.sign_weightKg = temp.sign_weightKg
    return result
  }
  parseHeartRate(text,start,end){
    //心率60次每分钟
    //心率四十五每分
    //心率80次
    let act=`心率`
    let measure=`([次每分钟/]+)`
    let heartRateReg=new RegExp(`${act}(${this.formula})(${measure})`)
    let value,unit,result={}
    let match = text.match(heartRateReg)
    console.log("heartRate",heartRateReg,"\n",match)
    if (match) {
      value=this.formula2num([[match[3],match[4],match[5]],match[6],[match[8],match[9],match[10]]])
      unit =match[11]
      unit="次/分钟"
      result.sign_heartRate=[{"unit":unit,
                       "value":value,
                       "eDate":this.getDate(end),
                       "eTime":this.getTime(end)}]
    }
    return result
  }
  parseWeight(text,start,end){
    //体重76.5公斤
    //体重80减二点五公斤
    //体重76.5增加百分之十公斤
    let act=`体重`
    let measure=`(克|千克|公斤|斤)`
    let weightReg=new RegExp(`${act}(${this.formula})[个]?(${measure})?`)
    let value,unit,result={}
    let match = text.match(weightReg)
    console.log("weight",weightReg,"\n",match)
    if (match) {
      value=this.formula2num([[match[3],match[4],match[5]],match[6],[match[8],match[9],match[10]]])
      unit =match[11]
      if (!unit) {
        unit="公斤"
      }
      value = Math.round(value * this.convert[unit]*10000)/10000
      result.sign_weightKg=[{"unit":"公斤",
                       "value":value,
                       "eDate":this.getDate(end),
                       "eTime":this.getTime(end)}]
    }
    return result
  }
}
class Sport extends Base{
  constructor(){
    super()
    this.act=`(?<=运动|步行|走|快走|慢走|跑了)[了]?`
    this.liangci = `部|步|米|公里|千米`
    this.convert={"公里":1,"千米":1,"米":0.001,"步":0.0005,"部":0.0005}
  }
  parse(text,start,end){
    let result={}
    let temp
    temp = this.parseSteps(text,end)
    if (temp) result.sport_steps = temp.sport_steps
    return result  
  }
  parseSteps(text,start,end){
    //步行了1000步
    //走了2500米
    //快走2公里
    let stepsReg=new RegExp(`${this.act}(${this.shuciA})[个]?(${this.liangci})`)
    let value,unit,result={}
    let steps = text.match(stepsReg)
    console.log("steps",steps)
    if (steps) {
      value=this.flex2num([steps[2],steps[3],steps[4]])
      unit =steps[5]
      value = Math.round(value * this.convert[unit]*10000)/10000
      unit="公里"
      result.sport_steps=[{value,unit,
                       "eDate":this.getDate(end),
                       "eTime":this.getTime(end)}]
    }
    return result
  }  
}
class Emotion extends Base{
}
class Behavior extends Base{
  constructor(){
    super()
    this.act=`(?<=休息|睡|睡眠|躺)[了]?`
    this.convert={}
  }
  parse(text,start,end){
    let result={}
    let temp
    temp = this.parseSleep(text,start,end)
    if (temp) result.behavior_sleep = temp.behavior_sleep
    return result  
  }
  parseSleep(text,start,end){
    //睡眠
    let sleepReg=new RegExp(`${this.act}${this.duration}`)
    let match = text.match(sleepReg)
    console.log("sleep",match)
    let value,unit,result={}
    if (match) {
      value=this.flex2hour([match[2],match[3],match[5],match[6]])
      if (value){
        unit ="小时"
        result.behavior_sleep=[{"value":value,
                      "unit":unit,
                       "sDate":this.getDate(start),
                       "sTime":this.getTime(start),
                       "eDate":this.getDate(end),
                       "eTime":this.getTime(end)}]
      }
    }
    return result
  }
}

exports.food = new Food()
exports.sign = new Sign()
exports.sport = new Sport()
exports.emotion = new Emotion()
exports.behavior = new Behavior()
