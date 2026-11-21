import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { BillingService, MAX_QUOTE_LOGO_BYTES } from '../../core/services/billing.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';
@Component({selector:'app-quote-logo',templateUrl:'./quote-logo.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class QuoteLogoComponent implements OnInit {
  private readonly billing=inject(BillingService);
  readonly logo=signal<string|null>(null);readonly pending=signal(false);readonly error=signal<string|null>(null);readonly message=signal<string|null>(null);
  ngOnInit():void {this.load();}
  load():void {this.billing.getPlan().subscribe({next:p=>this.logo.set(p.quoteLogo),error:()=>this.error.set('No pudimos cargar el logo de tus presupuestos.')});}
  upload(input:HTMLInputElement):void {
    const file=input.files?.item(0);input.value='';if(!file||this.pending())return;
    this.error.set(null);this.message.set(null);
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>MAX_QUOTE_LOGO_BYTES){this.error.set('Elegí una imagen PNG o JPEG de hasta 64 KiB.');return;}
    this.pending.set(true);const reader=new FileReader();
    reader.onerror=()=>{this.pending.set(false);this.error.set('No pudimos leer la imagen.');};
    reader.onload=()=>{if(typeof reader.result!=='string'){this.pending.set(false);return;}this.billing.updateQuoteLogo(reader.result).pipe(finalize(()=>this.pending.set(false))).subscribe({next:()=>{this.message.set('Logo actualizado.');this.load();},error:(e:HttpErrorResponse)=>this.error.set(extractApiErrorMessage(e,'No pudimos guardar el logo.'))});};reader.readAsDataURL(file);
  }
  remove():void {if(this.pending())return;this.pending.set(true);this.error.set(null);this.billing.removeQuoteLogo().pipe(finalize(()=>this.pending.set(false))).subscribe({next:()=>{this.logo.set(null);this.message.set('Logo eliminado.');},error:(e:HttpErrorResponse)=>this.error.set(extractApiErrorMessage(e,'No pudimos quitar el logo.'))});}
}
