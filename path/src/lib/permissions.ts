export const PERMS=['players','sessions','attendance','workload','games','matches','leaderboard','fines','reports','members','tests'] as const;
export type Permission=typeof PERMS[number];
export const permissionLabels:Record<Permission,string>={players:'Rosa',sessions:'Sedute',attendance:'Presenze',workload:'Carichi',games:'Partitelle',matches:'Partite',leaderboard:'Classifica',fines:'Multe',reports:'Report',members:'Staff',tests:'Test'};
export const defaultPermissions=(role:'OWNER'|'COLLABORATOR'|'CAPTAIN')=>Object.fromEntries(PERMS.map(p=>[p,role==='OWNER'||(role==='COLLABORATOR'&&p!=='members')||(role==='CAPTAIN'&&p==='fines')])) as Record<Permission,boolean>;
