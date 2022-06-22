export interface OrganizationSummaryVO {
  deptNo: string;
  employeePositionGradeList: Array<number>;
  orgPositionGradeList: Array<number>;
  orgLayerList: Array<number>;
  subDepartmentVOList: Array<DepartmentVO>;
}
