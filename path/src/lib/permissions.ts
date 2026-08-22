export const PERMS=['players','sessions','attendance','workload','games','matches','leaderboard','fines','reports','members'] as const;
export type Permission=typeof PERMS[number];
export const defaultPermissions=(role:'OWNER'|'COLLABORATOR'|'CAPTAIN')=>Object.fromEntries(PERMS.map(p=>[p,role==='OWNER'||(role==='COLLABORATOR'&&p!=='members')||(role==='CAPTAIN'&&p==='fines')])) as Record<Permission,boolean>;
