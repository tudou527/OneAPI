export interface StaffJobRatingCombinedVo {
  /** 员工工号 */
  workNo: string;
  /** Display Name */
  displayName: string;
  /** 部门编码 */
  deptNo: string;
  /** 部门名称 */
  deptName: string;
  /** 层级 */
  jobLevel: string;
  /** 当前人员岗级 */
  currentPersonPositionGrade: string;
  /** 当前大马小马 */
  currentMatchType: string;
  /** 财年 */
  year: string;
  /** 财年人员岗级 */
  yearPersonPositionGrade: string;
  /** 财年大马小马 */
  yearMatchType: string;
  /** 主管工号 */
  managerWorkNo: string;
  /** 主管姓名（花名） */
  managerDisplayName: string;
  jobCodeType: string;
  gradeDesc: string;
  /** 干部类别 */
  groupLabel: string;
}
