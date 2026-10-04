(()=>{
'use strict';
if(window.FundaCoursePaymentOptions)return;

function numberOf(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

function weeksOf(duration){
  if(typeof duration==='number'&&Number.isFinite(duration))return duration;
  const match=String(duration??'').match(/\d+(?:[.,]\d+)?/);
  return match?Number(match[0].replace(',','.')):0;
}

function rand(value,forceDecimals=false){
  const n=numberOf(value);
  if(n===null)return'Contact us';
  const cents=Math.round(n*100);
  const absolute=Math.abs(cents);
  const whole=Math.floor(absolute/100).toLocaleString('en-US').replace(/,/g,' ');
  const fraction=String(absolute%100).padStart(2,'0');
  const hasCents=absolute%100!==0;
  return`R${cents<0?'-':''}${whole}${forceDecimals||hasCents?'.'+fraction:''}`;
}

function randFromCents(cents){
  const whole=Number(cents)/100;
  return rand(whole,Math.abs(cents)%100!==0);
}

function describe(price,duration){
  const amount=numberOf(price);
  const weeks=weeksOf(duration);
  if(amount===null||amount<0){
    return{
      type:'contact',count:0,label:'Payment details',value:'Contact us',
      note:'Payment options are confirmed during enrolment.',fullPaymentAvailable:false
    };
  }

  if(amount<1000){
    return{
      type:'full',count:1,label:'Full payment',value:rand(amount),
      note:'One payment required',fullPaymentAvailable:true
    };
  }

  const totalCents=Math.round(amount*100);
  if(amount>=2000&&weeks>=8){
    const lowCents=Math.floor(totalCents/3);
    const highCents=Math.ceil(totalCents/3);
    const equal=lowCents===highCents;
    return{
      type:'three',count:3,label:'Three instalments',
      value:equal?`3 × ${randFromCents(lowCents)}`:`${randFromCents(lowCents)}–${randFromCents(highCents)} each`,
      note:equal?'Three equal payments · full payment also available':'Three payments · final cents are balanced at enrolment',
      fullPaymentAvailable:true
    };
  }

  const lowCents=Math.floor(totalCents/2);
  const highCents=Math.ceil(totalCents/2);
  const equal=lowCents===highCents;
  return{
    type:'two',count:2,label:'Two instalments',
    value:equal?`2 × ${randFromCents(lowCents)}`:`${randFromCents(lowCents)}–${randFromCents(highCents)} each`,
    note:equal?'Two equal payments · full payment also available':'Two payments · final cents are balanced at enrolment',
    fullPaymentAvailable:true
  };
}

window.FundaCoursePaymentOptions=Object.freeze({describe,rand,weeksOf});
})();
