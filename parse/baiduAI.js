class TextRec{
  constructor(source){
    this.source=source
    this.reset()
  }
  reset(){
    this.words=this.source.words_result.map((x,i)=>{
      return {idx:i,words:x.words,location:x.location}
    })
  }
  find(patten){
    //返回符合patten的index数组
    return this.words.
      filter((x,i)=>{
        if (x.words.match(new RegExp(patten))) return true
    })
  }
  exclude(index,pos={}){
    let left=pos.left
    let right=pos.right
    let top=pos.top
    let bottom=pos.bottom
    let word=this.words[index]
    let toMove=[],word_result=[]
    this.words=this.words.filter((x,i)=>{
      if (left!=undefined && word.location.left-x.location.left-x.location.width>left ){
        return false
      }
      if (top!=undefined && word.location.top-x.location.top-x.location.height>top){
        return false
      }
      if (right!=undefined && x.location.left-word.location.left-word.location.width>right){
        return false
      }
      if (bottom!=undefined && x.location.top-word.location.top-word.location.top>bottom){
        return false
      }
      return true
    }).sort((x,y)=>{return x.idx-y.idx})
      .map((x,i)=>{return {idx:i,words:x.words,location:x.location}})
    console.log("after exclude:",word.words,this.words)
  }
  findNearTop(index,distance=null){
    //定位最近的location.top
    //返回words数组
    let word = this.words[index]
    let left=word.location.left
    let top=word.location.top
    let dis
    return this.words.map((x,i)=>{
      let xleft=x.location.left
      let xtop=x.location.top
      if (top>xtop){
        dis = Math.sqrt((left-xleft)**2+(top-xtop)**2)
        console.log("findNearTop",i,word,x.words,"word:",left,top,"x:",xleft,xtop,"dis:",dis)
        if (!distance){
          return {"index":i,"words":x.words,"location":x.location,"distance":dis}
        }
        if (dis<distance){
            return {"index":i,"words":x.words,"location":x.location,"distance":dis} 
        } 
      }
    }).filter(w=>w).sort((m,n)=>m.distance-n.distance)
  }
  maxRight(pattens){
    //返回length最长的words的index
    pattens=pattens.join("|")
    return this.words
       .filter(x=>{
          return x.words.match(new RegExp(pattens))
        })
       .sort((x,y)=>y.location.left+y.location.width-x.location.left-x.location.width)
       .map(x=>x.idx)[0]
  }
  isSameParam(idx,withIdx){
    //判断idx是否属于withIdx段落
    console.log("isSameParam",idx,withIdx)
    let x1=this.words[idx].location.top
    let height1=this.words[idx].location.height
    let x2=this.words[withIdx].location.top 
    let height2=this.words[withIdx].location.height
    if ((x1-x2-height2)>height2*0.8) {
      return true
    }
    console.log("isSameParam:",x1,x2,height2,x1-x2-height2)
    return false
  }
  findTitle(height=null){
    //定位location.height超过参数height或source中最大的一组words
    //返回:如果制定了height则返回数组，否则返回height最大记录
    if (height){
       return this.words
         .filter(x=>x.location.height>=height)
         .sort((x,y)=>y.location.height-x.location.height)
    }else{
       let temp = this.words
         .sort((x,y)=>y.location.height-x.location.height)
       return temp[0]
    }
  }
}

exports.TextRec=TextRec