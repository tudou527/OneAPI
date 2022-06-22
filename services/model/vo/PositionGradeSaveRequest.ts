export interface PositionGradeSaveRequest {
  /** 员工工号 */
  workNo: string;
  /** 员工岗级 */
  personPositionGrade: string;
  personPrePositionGrade: string;
  /** 岗级备注 */
  gradeDesc: string;
  modifyRemark: string;
  /** 状态：empCommon、empEntry、empDimission、empPosChange */
  status: string;
  year: string;
  selfVisible: boolean;
  managerVisible: boolean;
  objType: string;
  groupLabel: string;
  userDefinedLabel1: string;
  userDefinedLabel2: string;
  /** 导入第几行 */
  lineNum: number;
}
