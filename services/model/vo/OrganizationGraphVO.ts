export interface OrganizationGraphVO {
  deptNo: string;
  deptName: string;
  orgLayer: number;
  orgPositionGrade: string;
  teamSize: number;
  ringType: string;
  workNo: string;
  name: string;
  nick: string;
  img: string;
  jobLevel: string;
  positionGrade: string;
  positionType: string;
  jobCode: string;
  promotionTime: string;
  performance: string;
  potential: string;
  managerSnapshot: string;
  acting: boolean;
  /** 大马/小马/正常 */
  matchType: string;
  displayName: string;
  children: Array<OrganizationGraphVO>;
  /** 统计量(满足筛选条件的统计量,可以是组织节点数/人员数) */
  statisticCount: number;
  /** 当前图谱返回的节点数 */
  graphNodeCount: number;
  /** 根据组织层级筛选事,目标层级 */
  targetLayer: number;
}
