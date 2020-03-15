const moment = require('moment')
const Base = require('./nlpBase.js').Base
const calendar = require('./calendar').calendar
class NlpMoment extends Base{
  constructor(){
    super()
    this.years=[{"name":"大前年","value":-3},
                {"name":"前年","value":-2},
                {"name":"去年","value":-1},
                {"name":"今年","value":0},
                {"name":"本年","value":0},
                {"name":"明年","value":1},
                {"name":"后年","value":2},
                {"name":"大后年","value":3}]
    this.cnYears = this.years.map(x=>x.name).join("|")
    this.months=[{"name":"大前个月","value":-3},
                {"name":"前个月","value":-2},
                {"name":"上个月","value":-1},
                {"name":"这个月","value":0},
                {"name":"本月","value":0},
                {"name":"当月","value":0},
                {"name":"下个月","value":1},
                {"name":"下下个月","value":2}]
    this.cnMonths = this.months.map(x=>x.name).join("|")
    this.dates=[{"name":"大前天","value":-3},
                {"name":"前天","value":-2},
                {"name":"昨天","value":-1},
                {"name":"昨","value":-1},
                {"name":"今天","value":0},
                {"name":"当天","value":0},
                {"name":"今","value":0},
                {"name":"明天","value":1},
                {"name":"明","value":1},
                {"name":"后天","value":2},
                {"name":"大后天","value":3}]
    this.cnDates = this.dates.map(x=>x.name).join("|")
    this.holidays=[
     {"name":"元旦节","holi":["元旦","新年"],"date":"01.01","type":"公历"},
     {"name":"妇女节","holi":["妇女","三八","38"],"date":"03.08","type":"公历"},
     {"name":"植树节","holi":["植树"],"date":"03.12","type":"公历"},
     {"name":"清明节","holi":["清明"],"date":"04.05","type":"公历"},
     {"name":"劳动节","holi":["劳动","五一"],"date":"05.01","type":"公历"},
     {"name":"儿童节","holi":["儿童","61","六一"],"date":"06.01","type":"公历"},
     {"name":"教师节","holi":["教师"],"date":"09.10","type":"公历"},
     {"name":"国庆节","holi":["国庆"],"date":"10.01","type":"公历"},
     {"name":"光棍节","holi":["光棍","双十一","双11"],"date":"11.11","type":"公历"},
     {"name":"情人节","holi":["情人"],"date":"02.14","type":"公历"},
     {"name":"愚人节","holi":["愚人"],"date":"04.01","type":"公历"},
     {"name":"万圣节","holi":["万圣"],"date":"11.01","type":"公历"},
     {"name":"圣诞节","holi":["圣诞"],"date":"12.25","type":"公历"},
     {"name":"春节","holi":["春","大年初一"],"date":"01.01","type":"农历"},
     {"name":"元宵节","holi":["元宵","上元"],"date":"01.15","type":"农历"},
     {"name":"端午节","holi":["端午"],"date":"05.05","type":"农历"},
     {"name":"七夕节","holi":["七夕"],"date":"07.07","type":"农历"},
     {"name":"中秋节","holi":["中秋","仲秋","中元"],"date":"08.15","type":"农历"},
     {"name":"重阳节","holi":["重阳"],"date":"09.09","type":"农历"},
     {"name":"腊八节","holi":["腊八"],"date":"12.08","type":"农历"},
     {"name":"除夕节","holi":["除夕","大年夜","除夕夜"],"date":"12.30","type":"农历"},
     {"name":"小年","holi":["小年","小年夜"],"date":"12.24","type":"农历"},
     {"name":"小寒","holi":["小寒"],"date":"01.05-07","type":"节气","index":1},
     {"name":"大寒","holi":["大寒"],"date":"01.20-21","type":"节气","index":2},
     {"name":"立春","holi":["立春"],"date":"02.03-05","type":"节气","index":3},
     {"name":"雨水","holi":["雨水"],"date":"02.18-20","type":"节气","index":4},
     {"name":"惊蛰","holi":["惊蛰"],"date":"03.05-07","type":"节气","index":5},
     {"name":"春分","holi":["春分"],"date":"03-20-22","type":"节气","index":6},
     {"name":"清明","holi":["清明"],"date":"04.04-06","type":"节气","index":7},
     {"name":"谷雨","holi":["谷雨","谷雨那天"],"date":"04.19-21","type":"节气","index":8},
     {"name":"立夏","holi":["立夏"],"date":"05.05-07","type":"节气","index":9},
     {"name":"小满","holi":["小满"],"date":"05.20-22","type":"节气","index":10},
     {"name":"芒种","holi":["芒种"],"date":"06.05-07","type":"节气","index":11},
     {"name":"夏至","holi":["夏至"],"date":"06.21-22","type":"节气","index":12},
     {"name":"小暑","holi":["小暑"],"date":"07.06-08","type":"节气","index":13},
     {"name":"大暑","holi":["大暑"],"date":"07.22-24","type":"节气","index":14},
     {"name":"立秋","holi":["立秋"],"date":"08.07-09","type":"节气","index":15},
     {"name":"处暑","holi":["处暑"],"date":"08.22-24","type":"节气","index":16},
     {"name":"白露","holi":["白露"],"date":"09.07-09","type":"节气","index":17},
     {"name":"秋分","holi":["秋分"],"date":"09.22-24","type":"节气","index":18},
     {"name":"寒露","holi":["寒露"],"date":"10.08-09","type":"节气","index":19},
     {"name":"霜降","holi":["霜降"],"date":"10.23-24","type":"节气","index":20},
     {"name":"立冬","holi":["立冬"],"date":"11.07-08","type":"节气","index":21},
     {"name":"小雪","holi":["小雪"],"date":"11.22-23","type":"节气","index":22},
     {"name":"大雪","holi":["大雪"],"date":"12.06-08","type":"节气","index":23},
     {"name":"冬至","holi":["冬至"],"date":"12.21-23","type":"节气","index":24},
]

//* @trans["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"]

    this.cnHolidays=this.holidays.reduce((x,y)=>{
        return {"holi":x.holi.concat(y.holi)}
      })["holi"].join("|")
    this.segs=[{"name":"凌晨","seg":["凌晨"],"time":"05:00:00"},
               {"name":"清晨","seg":["早晨","清晨","早餐","早上","清早","一早","一大早","一大清早","早"],"time":"07:00:00"},
               {"name":"上午","seg":["上午"],"time":"09:00:00"},
               {"name":"中午","seg":["中午","午餐","中餐"],"time":"12:00:00"},
               {"name":"下午","seg":["下午"],"time":"15:00:00"},
               {"name":"晚上","seg":["晚上","傍晚","黄昏","晚餐","晚"],"time":"18:00:00"},
               {"name":"夜晚","seg":["夜晚","夜宵"],"time":"22:00:00"},
               {"name":"子夜","seg":["子夜"],"time":"00:00:00"},
               {"name":"午夜","seg":["午夜","半夜"],"time":"02:00:00"},
               {"name":"现在","seg":["现在","刚才","刚刚"],"time":"now"}]
    this.cnSegs = this.segs.reduce((x,y)=>{
        return {"seg":x.seg.concat(y.seg)}
      })["seg"].join("|")
    
    this.weekci=`一|二|三|四|五|六|日|天|末|[1-6]`
    this.liangci = `秒|秒钟|分|分钟|小时|钟头|天|周|礼拜|星期|月|年`
    this.dateExp=`((${this.shuci}+)[个]?(半)?(${this.liangci})(${this.shuci}+)?(${this.liangci})?[之以]?(前|后)((${this.cnHolidays})[节日]?)?((${this.shuci}+)月|(${this.cnMonths}))?((${this.shuci}+)[日号]|(${this.cnDates}))?(${this.cnSegs})?((${this.shuci}+)[点小时:]+)?((${this.shuci}+)(分|分钟)?)?)|((这|本|上|前|下|后)[个]?(星期|礼拜|周)(${this.weekci})(${this.cnSegs})?((${this.shuci}+)[点小时:]+)?((${this.shuci}+)(分钟|分)?)?)|(((${this.shuci}+)年|(${this.cnYears}))?((${this.cnHolidays})[节日]?)?((${this.shuci}+)月|(${this.cnMonths}))?((${this.shuci}+)[日号]|(${this.cnDates}))?(${this.cnSegs}?)?((${this.shuci}+)[点小时:]+)?((${this.shuci}+)(分|分钟)?)?)`
  }
  startOf(){
    var nowTemp = new Date();//当前时间
    var oneDayLong = 24*60*60*1000 ;//一天的毫秒数
    var c_time = nowTemp.getTime() ;//当前时间的毫秒时间
    var c_day = nowTemp.getDay()||7;//当前时间的星期几
    var m_time = c_time - (c_day-1)*oneDayLong;//当前周一的毫秒时间
    var monday = new Date(m_time);//设置周一时间对象
    return mondy
  }
  subtract(value,unit){
  }
  add(value,unit){
  }
  cn2day(str,dir){
    let cn2numBefore={"一":-6,"二":-5,"三":-4,"四":-3,"五":-2,
                "六":-1,"天":-7,"日":-7,"末":-2,
                "1":-6,"2":-5,"3":-4,"4":-3,"5":-2,"6":-1}
    let cn2numAfter={"一":8,"二":9,"三":10,"四":11,"五":12,
                "六":13,"天":14,"日":14,"末":12,
                "1":8,"2":9,"3":10,"4":11,"5":12,"6":13}
    let cn2numCurrent={"一":1,"二":2,"三":3,"四":4,"五":5,
                "六":6,"天":0,"日":0,"末":5,
                "1":1,"2":2,"3":3,"4":4,"5":5,"6":6}
    switch (dir){
      case -1:
        return cn2numBefore[str]
      case 0:  
        return cn2numCurrent[str]
      case 1:
        return cn2numAfter[str]
    }
  }
  
  translateUnit(str){
    let cn2unit={"秒":"seconds","秒钟":"seconds",
                 "分":"minutes","分钟":"minutes",
                 "小时":"hours","钟头":"hours",
                 "天":"days","周":"weeks","星期":"weeks",
                 "礼拜":"weeks","月":"months","年":"years"}
    return cn2unit[str]
  }
  setDate(yearTextArr,holidayText,monthTextArr,dateTextArr){
    let temp,lunar
    let toSetDate={"years":0,"months":0,"date":1}
    console.log(yearTextArr,holidayText,monthTextArr,dateTextArr)
    //year
    if (yearTextArr[0]||yearTextArr[1]) toSetDate.acc="years"
    if (yearTextArr[0]){
      toSetDate.years=this.cn2num(yearTextArr[0])
      if (toSetDate.years<100)
        toSetDate.years=2000+toSetDate.years
    }else if(yearTextArr[1]){
      for (let item of this.years){
        if (item.name==yearTextArr[1]){
          console.log(item)
          toSetDate.years = moment().utcOffset(8).add(item.value,"years").year()
          break
        }
      }
    }
    if (!toSetDate.years){
      toSetDate.years = moment().utcOffset(8).year()
    }
    console.log("year:",yearTextArr,toSetDate)
    //month
    if (monthTextArr[0]||monthTextArr[1]) toSetDate.acc="months"
    if (monthTextArr[0]){
        toSetDate.months=this.cn2num(monthTextArr[0]) - 1
    }else if(monthTextArr[1]){
      for (let item of this.months){
        if (item.name==monthTextArr[1]){
          temp = moment().utcOffset(8).add(item.value,"month")
          toSetDate.months = temp.month()
          toSetDate.years = temp.year()
          break
        }
      }
    }else{
      if (toSetDate.acc!="years")
        toSetDate.months = moment().utcOffset(8).month()
    }
    console.log("month",monthTextArr,toSetDate)
    //holiday
    if (holidayText){
      toSetDate.acc="days"
      for (let item of this.holidays){
        if (item.holi.includes(holidayText)){
          if (item.type=="农历"){
            temp=item.date.split(".")
            lunar = calendar.lunar2solar(toSetDate.years,temp[0],temp[1])
            toSetDate.years = lunar.cYear
            toSetDate.months =lunar.cMonth -1 
            toSetDate.date = lunar.cDay
          }else if (item.type=="节气"){
            toSetDate.months = item.date.split(".")[0]-1
            toSetDate.date = calendar.getTerm(toSetDate.years,item.index)
          }else{
            temp=item.date.split(".")
            toSetDate.months = parseInt(temp[0])-1
            toSetDate.date =parseInt(temp[1])
            break
          }
        }
      }
      console.log("holiday：",holidayText,toSetDate)
    }
    //day
    if (dateTextArr[0]||dateTextArr[1]) toSetDate.acc="days"
    if (dateTextArr[0]){
        toSetDate.date=this.cn2num(dateTextArr[0])
    }else if (dateTextArr[1]){
      for (let item of this.dates){
        if (item.name==dateTextArr[1]){
          temp = moment().utcOffset(8).add(item.value,"days")
          toSetDate.date = temp.date()
          toSetDate.months = temp.month()
          toSetDate.years = temp.year()
          break
        }
      }
    }else{
      if (toSetDate.acc!="months" && toSetDate.acc!="years" && toSetDate.acc!="days")
      toSetDate.date = moment().utcOffset(8).date()
    }
    console.log("date",dateTextArr,toSetDate)
    return toSetDate
  }
  setTime(segText,hourText,minuteText){
    let temp
    let now = this.nowE8()
    //let toSetTime={"hours":now.getHours(),
    //               "minutes":now.getMinutes(),
    //               "seconds":now.getSeconds()}
    let toSetTime={"hours":0,"minutes":0,"seconds":0}

    //seg
    if (segText){
      for (let item of this.segs){
        if (item.seg.includes(segText)){
          if (item.time=="now"){
            toSetTime={acc:"minute"}
          }else{
            temp=item.time.split(":")
            toSetTime={
                   "hours":temp[0],
                   "minutes":temp[1],
                   "seconds":0,
                   "acc":"minute"}
            break
          }
        }
      }
    }      
    console.log("seg",segText,toSetTime)    
    //hour
    if (hourText){
      toSetTime.acc="hours"
      temp = this.cn2num(hourText)
      console.log("temp=",temp,"toSetTime:",toSetTime)
      if (toSetTime.hours>=12 && temp<12){
        toSetTime.hours=temp+12
        toSetTime.minutes=0
        toSetTime.seconds=0
      }else{
        toSetTime.hours=temp
        toSetTime.minutes=0
        toSetTime.seconds=0
      }
    }
    console.log("hour",hourText,toSetTime)
    //minute
    if (minuteText){
      toSetTime.acc="minutes"
      if (minuteText=="半"){
        toSetTime.minutes = 30
      }else{
        toSetTime.minutes = this.cn2num(minuteText)
      }
    }
    console.log("minute",minuteText,toSetTime)
    return toSetTime
  }
  
  parse(text){
    let result
    let value,unit,value1,unit1,value2,unit2,direct,half
    let year,month,date,seg,hour,minute
    let temp
    let toSetDate={} , toSetTime={}
    let reg1Index = 1 
    let reg2Index = 22
    let reg3Index = 32
    result=text.match(new RegExp(`${this.dateExp}`))
    console.log(new RegExp(`${this.dateExp}`))
    if (result){    
        console.log("reg1",result[reg1Index])
        console.log("reg2",result[reg2Index])
        console.log("reg3",result[reg3Index])
        console.log("result",result)
      if (result[reg1Index]){ //第一种语句：几分钟前、三小时后
        value1 = this.cn2num(result[reg1Index+1])
        half=result[reg1Index+2]?0.5:0
        value1=value1+half
        value2=this.cn2num(result[reg1Index+4])
        unit1=this.translateUnit(result[reg1Index+3])
        unit2=this.translateUnit(result[reg1Index+5])
        if (value2==0.5 && !unit2){ //两天半
          unit2=unit1
        }
        direct = result[reg1Index+6]
        if (direct=="前"){
          temp = moment().utcOffset(8).subtract(value1,unit1).subtract(value2,unit2)
        }else{
          temp = moment().utcOffset(8).add(value1,unit1).add(value2,unit2)
        }
        if (unit1=="years"){
          temp = temp.startOf("years")
        }else if (unit1=="months"){
          temp = temp.startOf("months")
        }else if (unit1=="days"){
          temp = temp.startOf("days")
        }else if (unit1=="hours"){
          temp = temp.startOf("hours")
        }else if (unit1=="minutes"){
          temp = temp.startOf("minutes")
        }

        console.log("new time:",temp.format("YYYY.MM.DD HH:mm:ss"))
        console.log("acc",unit1,unit2)
        console.log("reg1Index+8",result[reg1Index+8])
        console.log("reg1Index+10",result[reg1Index+10],result[reg1Index+11],temp.month())
        console.log("reg1Index+13",result[reg1Index+13],result[reg1Index+14],temp.date())

        toSetDate = this.setDate([temp.year(),undefined], //year
                                 result[reg1Index+8],     //holiday
                                 [result[reg1Index+10]?result[reg1Index+10]:(unit1=="months"?temp.month()+1:undefined),result[reg1Index+11]], //月
                                 [result[reg1Index+13]?result[reg1Index+13]:(unit1=="days"?temp.date():undefined),result[reg1Index+14]]) //日
        toSetTime = this.setTime(result[reg1Index+15], //seg
                                 result[reg1Index+17]?result[reg1Index+17]:(unit1=="hours"?temp.hour():undefined), //hour
                                 result[reg1Index+19]?result[reg1Index+19]:(unit1=="minutes"?temp.minute():undefined)) //minutes
        console.log("date,time",toSetDate,toSetTime)
        
        result = moment().utcOffset(8).set(toSetDate).set(toSetTime).toDate()
        return {datetime:this.nowE8(result.getTime()),acc:toSetTime.acc||toSetDate.acc||unit1}
      }
      
      if (result[reg2Index]){ //第二种语句：上个礼拜五下午3点、下个周末早上9点
        direct = result[reg2Index+1]
        unit = result[reg2Index+2]
        if (["上","前"].includes(direct)){
          value = this.cn2day(result[reg2Index+3],-1)
        }else if (["下","后"].includes(direct)){
          value = this.cn2day(result[reg2Index+3],1)
        }else{
          value = this.cn2day(result[reg2Index+3],0)
        }
        toSetTime=this.setTime(result[reg2Index+4],
                               result[reg2Index+6],
                               result[reg2Index+7])
        
        console.log(value,unit,direct,toSetTime)
        
        result = moment().utcOffset(8).startOf("week").set(toSetTime).add(value,"days").toDate()
        return {datetime:this.nowE8(result.getTime()),acc:toSetTime.acc||"days"}
      }

      if (result[reg3Index]){ // 第三种语句：2020年11月5日7点半
        toSetDate = this.setDate([result[reg3Index+2],
                                  result[reg3Index+3]],
                                 result[reg3Index+5], 
                                 [result[reg3Index+7],
                                  result[reg3Index+8]],
                                 [result[reg3Index+10],
                                  result[reg3Index+11]])
        toSetTime = this.setTime(result[reg3Index+12],
                                 result[reg3Index+14],
                                 result[reg3Index+16])
        console.log("date,time3",toSetDate,toSetTime)
        result = moment().utcOffset(8).set(toSetDate).set(toSetTime).toDate()
        console.log("result3",result,toSetTime.acc||toSetDate.acc)
        return {datetime:this.nowE8(result.getTime()),acc:toSetTime.acc||toSetDate.acc}
      }
    }else{
      return null
    }
  }
  parseDuration(text){
    let reg=new RegExp(`([自从打]*(.*)[直到至]+)?(.*)`)
    let toParse = text.match(reg)
    console.log(toParse,toParse[2],toParse[3])
    let start,end,acc
    if (toParse[2]){
      let temp = this.parse(toParse[2])
      start=temp.datetime
      acc = temp.acc
    }
    if (toParse[3]){
      let temp = this.parse(toParse[3])
      console.log("end parse end",temp)
      if (temp){
        let datetime = temp.datetime 
        acc = temp.acc
        if (start) {
          end = datetime
        }else{
          switch (acc){
            case "years":
              start = datetime
              end =  this.nowE8(moment(datetime).endOf("year").toDate().getTime())
              break
            case "months":
              start = datetime
              end =  this.nowE8(moment(datetime).endOf("month").toDate().getTime())
              break
            case "days":
              start = datetime
              end =  this.nowE8(moment(datetime).endOf("day").toDate().getTime())
              break
            case "hours":
              start = datetime
              end =  this.nowE8(moment(datetime).endOf("hour").toDate().getTime()-8*60*60*1000)
              break
            case "minutes":
              start = datetime
              end = datetime
              break
            default:
              start= datetime
              end = datetime
          }
        }
      }
    console.log("result parseDuration",start,end,acc)
    return [start,end,acc]
  }
}
  help(topic=null){
      let text=
      `
      <html>
      <body>
        <h1>一、2小时前表示法</h1>
        <p>2个小时前</p>
        <p>3天后</p>
        <h1>二、上星期表示法</h1>
        <p>上礼拜5下午2点半</p>
        <p>本周三早上</p>
        <p>下个周末中午一点25分</p>
        <h1>三、年月日表示法</h1>
        <p>全年3月5日晚上9点</p>
        <p>昨天凌晨4点钟</p>
        <p>7号上午8:40></p>
        <h1>四、区间表示法</h1>
        <p>上个月5日到上礼拜五</p>
        <p>自从昨晚9点直到今早7点四十</p>
      </body>
      </html>
      `
      return text
  }
}

exports.nlpMoment  = new NlpMoment()