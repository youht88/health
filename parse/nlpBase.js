const _ = require("underscore")
const moment = require("moment")
class Base{
  constructor(){
    this.shuci=`[\\d\\.点零半正元一二两三四五六七八九十百千万]`
    this.shuciA=`(${this.shuci}+)(分之|%|/)?(${this.shuci}*)`
    this.duration=`((${this.shuci}+)[个]?(小时|钟头))?[，。]?((${this.shuci}+)[个]?(分钟|分))?`
    this.formula=`(${this.shuciA})?([增少加减乘除\\+\\-\\*/×÷上去以掉]+)?(${this.shuciA})?`
    this.join=`和|以及|还有|，|,|\\.|。`
  }
  registerDB(db){
    this.db = db
  }
  nowE8(timestamp=null,formatStr=null){
    if (timestamp){
      if (formatStr)
        return moment(new Date(timestamp+28800000)).format(formatStr)  
      else{ 
        if (typeof timestamp == "string"){ 
          return moment(new Date().getTime()+28800000).format(timestamp)
        }else {
          return new Date(timestamp+28800000)
        }
      }
    }else{
      if (formatStr)
        return moment(new Date().getTime()+28800000).format(formatStr)
      else
        return new Date(new Date().getTime()+28800000)
    }
  }
  getDate(datetime){
    //datetime 必须是Date类型
    if (!datetime){
      //return this.nowE8("YYYY.MM.DD")
      return moment().format("YYYY.MM.DD")
    }else{
      //return this.nowE8(datetime.getTime()-28800000,"YYYY.MM.DD")
      return moment(datetime.getTime()-28800000).format("YYYY.MM.DD")
    }
  }
  getTime(datetime){
    //datetime 必须是Date类型
    if (!datetime){
      //return this.nowE8("HH:mm:SS")
      return moment().format("HH:mm:SS")
    }else{
      //return this.nowE8(datetime.getTime()-28800000,"HH:mm:SS")
      return moment(datetime.getTime()-28800000).format("HH:mm:ss")
    }
  }  
  //同名字串实体转为数组
  synName2Array(text){
    var test="也叫|又称|又叫|或|、|；|;|,|，|\\(|\\)|（|）"
    return text.split(new RegExp(test)).filter(x=>x)
  }
  replace(text,fromArr,toArr){
    if (fromArr.length!=toArr.length) return text
    fromArr.map((x,i)=>text=text.replace(new RegExp(`${x}`,"g"),toArr[i]))
    return text
  }
  remove(text,pattenArr){
    let patten=pattenArr.join("|")    
    text=text.replace(new RegExp(patten,"g"),"")
    return text
  }

  benfordTest(data){
    if (!Array.isArray(data)) return
    let num=[1,2,3,4,5,6,7,8,9],numStr=["1","2","3","4","5","6","7","8","9"]
    let test = num.map(x=>Math.round(Math.log10((x+1)/x)*10000)/10000)
    let count = data.length
    let byte0 = data.map(x=>x.toString()[0])
    let detail = numStr.map(x=>{
        let idx = parseInt(x)
        let cnt = byte0.reduce((m,n,i)=>(i==1?(m==x?1:0):m)+(n==x?1:0))
        let rate = Math.round(cnt/count*10000)/10000
        let stand = test[idx-1]
        let diff = Math.round((rate - stand)*10000)/10000
        let weightDiff = Math.round(stand*diff*10000)/10000
        return {idx,cnt,rate,stand,diff,weightDiff}
    })
    let conf=1-Math.round(detail.reduce((x,y,i)=>(i==1?Math.abs(x.stand*x.diff):x)+Math.abs(y.stand*y.diff))*10000)/10000
    return {conf,detail}
  }
  flex2hour(strArr){
    console.log("flex2hour",strArr)
    //strArr为["三","小时","一","分钟"] 或 
    //        ["2.5","小时",undefined,undefined] 或
    //        [undefined,undefined,"33","分钟"] 
    if (!strArr[1]) {
      return Math.round(this.cn2num(strArr[2])/60*100)/100
    }
    if (!strArr[3]) return this.cn2num(strArr[0])
    return Math.round(this.cn2num(strArr[2])/60*100)/100+this.cn2num(strArr[0])
  }
  cn2num(w){  
    if (!w) return null
    if (typeof(w)=="number") w=w.toString()
    var dec=0
    var e = "零一二两三四五六七八九";
    var decode={"零":0,"一":1,"二":2,"两":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9}  
    var ew = ["十","百","千"];  
    var ej = ["万","亿"];  
    var rss = "^(["+e+ew.join("")+"]+"+ej[1]+")?(["+e+ew.join("")+"]+"+ej[0]+")?(["+e+ew.join("")+"]+)?"+"(点)?"+"(["+e+"]+)?"+"$";  
    //     ^([零一二三四五六七八九十百千]+亿)?([零一二三四五六七八九十百千]+万)?([零一二三四五六七八九十百千]+)?$   
    let numReg=new RegExp("[\\d]+|[\\d]+\\.[\d]+")
    if (w.match(numReg)){
      return parseFloat(w,4)
    }
    if (w=="半") {
      return 0.5
    }
    console.log("cn2num",w)
    var arr = new RegExp(rss).exec(w);  
    function foh(str){  
        str = new String(str);      
        var a=0;  
        if(str.indexOf(ew[0])==0)a=10;                
            str=str.replace(new RegExp("零","g"),"");  
        if(new RegExp("(["+e+"])$").test(str))  
            a+=decode[RegExp.$1];  
        if(new RegExp("(["+e+"])"+ew[0]).test(str))  
            a+=decode[RegExp.$1]*10;  
        if(new RegExp("(["+e+"])"+ew[1]).test(str))  
            a+=decode[RegExp.$1]*100;  
        if(new RegExp("(["+e+"])"+ew[2]).test(str))  
            a+=decode[RegExp.$1]*1000;  
        return a;  
    }
    if (arr[4]=="点" && arr[5]){
       dec=parseFloat("0."+arr[5].split("").map(x=>decode[x]).join(""))
    }
    return foh(arr[1])*100000000+foh(arr[2])*10000+foh(arr[3])+dec;  
  }  

  flex2num(strArr){
    console.log("flex2num",strArr)
    //strArr为["三","分之","一"] 或 
    //        ["1","/","3"] 或
    //        ["22.3","%",""] 或 
    //        ["12.345",undefined,""]
    if (!strArr[1]) return this.cn2num(strArr[0])
    if (strArr[1]=="/"){
      return Math.round(this.cn2num(strArr[0])/this.cn2num(strArr[2])*10000)/10000
    }
    if (strArr[1]=="分之"){
      return Math.round(this.cn2num(strArr[2])/this.cn2num(strArr[0])*10000)/10000
    }
    if (strArr[1]=="%"){
      return Math.round(this.cn2num(strArr[0])*100)/10000
    }
  }  
  formula2num(strArr){
    console.log("formula2num",strArr)
    //strArr为["三","乘以","一"] 或 
    //        ["1","/","3"] 或
    //        ["22.3",undefined,""] 或 
    //        [["12.345","%",""],"+","12"]
    if (!strArr[1]) {
      return Array.isArray(strArr[0])?this.flex2num(strArr[0]):this.cn2num(strArr[0])
    }
    if (["+","加","增加","加上"].includes(strArr[1])){
      let a=Array.isArray(strArr[0])?this.flex2num(strArr[0]):this.cn2num(strArr[0])
      let b
      if (Array.isArray(strArr[2])){
        if (("%","分之").includes(strArr[2][1])){
          b = a*this.flex2num(strArr[2])  
        }else{
          b = this.flex2num(strArr[2])
        }
      }else{
        b = this.cn2num(strArr[2])
      }
      return a+b
    }
    if (["-","减","减少","减去","减掉"].includes(strArr[1])){
      let a=Array.isArray(strArr[0])?this.flex2num(strArr[0]):this.cn2num(strArr[0])
      let b=Array.isArray(strArr[2])?this.flex2num(strArr[2]):this.cn2num(strArr[2])
      return a-b
    }
    if (["*","×","乘","乘上","乘以"].includes(strArr[1])){
      let a=Array.isArray(strArr[0])?this.flex2num(strArr[0]):this.cn2num(strArr[0])
      let b=Array.isArray(strArr[2])?this.flex2num(strArr[2]):this.cn2num(strArr[2])
      return a*b
    }
    if (["/","÷","除","除上","除以"].includes(strArr[1])){
      let a=Array.isArray(strArr[0])?this.flex2num(strArr[0]):this.cn2num(strArr[0])
      let b=Array.isArray(strArr[2])?this.flex2num(strArr[2]):this.cn2num(strArr[2])
      return a/b
    }
  }
}

exports.Base = Base