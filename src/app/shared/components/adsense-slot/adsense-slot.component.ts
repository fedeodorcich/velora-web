import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, inject, input, signal } from '@angular/core';
interface AdSenseWindow extends Window { adsbygoogle?: Array<Record<string,never>>; }
@Component({selector:'app-adsense-slot',standalone:true,templateUrl:'./adsense-slot.component.html',styleUrl:'./adsense-slot.component.scss'})
export class AdsenseSlotComponent implements AfterViewInit,OnDestroy {
 readonly compact=input(false);
 readonly config=input.required<{client:string;slot:string}>();
 private readonly document=inject(DOCUMENT);
 private destroyed=false;
 readonly failed=signal(false);
 ngAfterViewInit():void{void this.load();}
 ngOnDestroy():void{this.destroyed=true;}
 private async load():Promise<void>{
 const c=this.config();
 if(!/^ca-pub-[0-9]{16}$/.test(c.client)||!/^\d{1,20}$/.test(c.slot)){this.failed.set(true);return;}
 try{
 const view=this.document.defaultView as AdSenseWindow|null;
 if(!view)return;
 let script=this.document.querySelector<HTMLScriptElement>('script[data-bakrivo-adsense]');
 if(!script){
 script=this.document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.dataset['bakrivoAdsense']='true';
 script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(c.client);
 await new Promise<void>((resolve,reject)=>{
 const timeout=view.setTimeout(()=>reject(new Error('timeout')),12000);
 script!.addEventListener('load',()=>{view.clearTimeout(timeout);script!.dataset['ready']='true';resolve();},{once:true});
 script!.addEventListener('error',()=>{view.clearTimeout(timeout);script?.remove();reject(new Error('blocked'));},{once:true});
 this.document.head.appendChild(script!);
 });
 }else if(script.dataset['ready']!=='true')throw new Error('loading');
 if(this.destroyed)return;
 (view.adsbygoogle??=[]).push({});
 }catch{if(!this.destroyed)this.failed.set(true);}
 }
}
