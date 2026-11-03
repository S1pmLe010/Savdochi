'use client';
import {useEffect,useRef} from 'react';
// One request at a time; pause in background tabs and refresh on return/reconnect.
export function useLiveRefresh(refresh,delay,enabled=true){
 const latest=useRef(refresh);latest.current=refresh;
 useEffect(()=>{
  if(!enabled)return;let stopped=false,running=false,timer;
  async function tick(){if(stopped||running)return;clearTimeout(timer);if(document.hidden){timer=setTimeout(tick,delay);return;}running=true;
   try{await latest.current();}catch{}finally{running=false;if(!stopped)timer=setTimeout(tick,delay);}
  }
  const resume=()=>{if(!document.hidden)tick();};
  tick();window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);
  return()=>{stopped=true;clearTimeout(timer);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);};
 },[delay,enabled]);
}
