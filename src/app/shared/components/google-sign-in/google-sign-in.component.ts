import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
interface GoogleIdentity {
  initialize(config: {client_id:string; nonce:string; auto_select:boolean; callback:(result:{credential:string})=>void}):void;
  renderButton(element:HTMLElement, options:{type:string;theme:string;size:string;text:string;shape:string;width:number;locale:string}):void;
}
@Component({ selector:'app-google-sign-in', standalone:true, templateUrl:'./google-sign-in.component.html' })
export class GoogleSignInComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButton',{static:true}) button!:ElementRef<HTMLElement>;
  private readonly http=inject(HttpClient);
  private readonly auth=inject(AuthService);
  private readonly router=inject(Router);
  private readonly zone=inject(NgZone);
  private readonly document=inject(DOCUMENT);
  private destroyed=false;
  readonly visible=signal(false);
  readonly pending=signal(false);
  readonly error=signal<string|null>(null);
  ngAfterViewInit():void {
    this.http.get<{clientId:string|null}>(API_BASE_URL+'/auth/google/config').subscribe({
      next:config=>{if(config.clientId)void this.render(config.clientId);},
      error:()=>{}, // Correo y contraseña continúan disponibles si la API falla.
    });
  }
  ngOnDestroy():void {this.destroyed=true;}
  private async render(clientId:string):Promise<void> {
    try {
      const view=this.document.defaultView as (Window & {google?:{accounts:{id:GoogleIdentity}}})|null;
      if(!view)return;
      if(!view.google){await new Promise<void>((resolve,reject)=>{
        let script=this.document.querySelector<HTMLScriptElement>('script[data-google-identity]');
        if(!script){script=this.document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset['googleIdentity']='true';this.document.head.appendChild(script);}
        const timeout=view.setTimeout(()=>reject(new Error('timeout')),15000);
        script.addEventListener('load',()=>{view.clearTimeout(timeout);resolve();},{once:true});
        script.addEventListener('error',()=>{view.clearTimeout(timeout);script?.remove();reject(new Error('load'));},{once:true});
      });}
      if(this.destroyed)return;
      const identity=view.google?.accounts.id;
      if(!identity)throw new Error('Google no disponible');
      const nonce=view.crypto.randomUUID()+view.crypto.randomUUID();
      identity.initialize({client_id:clientId,nonce,auto_select:false,callback:result=>this.zone.run(()=>{
        if(this.destroyed||this.pending())return;
        this.pending.set(true);this.error.set(null);
        this.auth.google(result.credential,nonce).subscribe({
          next:()=>{if(!this.destroyed)void this.router.navigateByUrl('/dashboard');},
          error:(error:HttpErrorResponse)=>{if(!this.destroyed){this.pending.set(false);this.error.set(extractApiErrorMessage(error,'No pudimos ingresar con Google. Intentá nuevamente.'));}},
        });
      })});
      this.visible.set(true);
      identity.renderButton(this.button.nativeElement,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'pill',width:Math.min(384,this.button.nativeElement.parentElement?.clientWidth||280),locale:'es'});
    }catch{if(!this.destroyed)this.error.set('No pudimos cargar Google. Podés ingresar con correo y contraseña.');}
  }
}
