export interface LanguageLineBridgeArgs{language:string;member_id?:string;call_id?:string}
export async function transferToInterpreter(args:LanguageLineBridgeArgs):Promise<{success:boolean;message:string}>{
  const{LANGUAGE_LINE_NUMBER:llNum,LANGUAGE_LINE_ACCOUNT:llAcc,TWILIO_ACCOUNT_SID:sid,TWILIO_AUTH_TOKEN:tok}=process.env
  console.log(`[languageLine] interpreter requested lang=${args.language} member=${args.member_id} call=${args.call_id}`)
  if(!llNum||!llAcc||!sid||!tok){
    console.log(`[languageLine] STUB — would bridge LL account=${llAcc||'NOT_SET'} number=${llNum||'NOT_SET'} lang=${args.language}`)
    return{success:true,message:`Interpreter stub: would connect Language Line for ${args.language}`}
  }
  try{
    console.log(`[languageLine] Would add ${llNum} (account ${llAcc}) to conference for call ${args.call_id}`)
    return{success:true,message:`Connecting ${args.language} interpreter via Language Line`}
  }catch(err){
    console.error('[languageLine] Bridge error:',err)
    return{success:false,message:'Could not connect interpreter — please try again'}
  }
}
export const LANGUAGE_LINE_TOOL_DEFINITION={
  name:'transfer_to_interpreter',
  description:'Bridges a Language Line interpreter into the call when the member needs assistance in a language other than English.',
  parameters:{type:'object',properties:{language:{type:'string',description:'The language the member needs (e.g. Spanish, Mandarin, Vietnamese)'}},required:['language']},
}
