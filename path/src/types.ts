export type Role='OWNER'|'COLLABORATOR'|'CAPTAIN';
export type PlayerStatus='ACTIVE'|'ARCHIVED';
export type Player={id:string;season_id:string;first_name:string;last_name:string;shirt_number:number|null;position:string|null;notes:string|null;status:PlayerStatus;created_at:string;archived_at:string|null};
export type Season={id:string;owner_id:string;name:string;team_name:string;sporting_year:string;access_code:string;created_at:string};
export type Session={id:string;season_id:string;session_date:string;session_type:'TRAINING'|'MATCH';title:string|null;notes:string|null;created_by:string|null;created_at:string};
export type Member={id:string;season_id:string;user_id:string;role:Role;status:string;permissions:Record<string,boolean>;profiles?:{full_name:string|null;email:string|null}};
export type Attendance={id?:string;session_id:string;player_id:string;status:'PRESENT'|'ABSENT';absence_reason:'INJURED'|'OTHER'|'UNJUSTIFIED'|null};
export type Load={id?:string;session_id:string;player_id:string;rpe:number|null;duration_minutes:number;load:number|null};
