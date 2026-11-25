(function(){
  var root=document.documentElement, KEY="wm-theme";
  var btns=document.querySelectorAll("[data-theme-set]");
  function paint(){
    for(var i=0;i<btns.length;i++){
      btns[i].classList.toggle("on", btns[i].getAttribute("data-theme-set")===root.getAttribute("data-theme"));
    }
  }
  for(var i=0;i<btns.length;i++){
    btns[i].addEventListener("click", function(){
      var t=this.getAttribute("data-theme-set");
      root.setAttribute("data-theme",t);
      try{ localStorage.setItem(KEY,t); }catch(e){}
      paint();
    });
  }
  paint();
})();