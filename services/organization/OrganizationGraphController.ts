/**
 * 获取部门信息
 * 1. keyword为空时,获取登录用户所负责的部门列表
 * 2. keyword不为空,根据keyword查询用户所负责的下属组织
 * @return
 */
export async function getDepartmentList(keyword: string): Promise<PojoResult<Array<DepartmentVO>>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 获取指定组织的组织层级范围、组织岗级范围、人员岗级范围和下一层组织
 * @param deptNo 部门编号
 * @return
 */
export async function getSummary(deptNo: string): Promise<PojoResult<OrganizationSummaryVO>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 获取指定组织下的员工职务、绩效、潜力等列表
 * @param deptNos
 * @return
 */
export async function getStaffSummary(deptNos: Array<string>): Promise<PojoResult<MultiDropDownListVO>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 查询组织图谱
 * <p>
 * layer和positionGrade互斥,layer优先于positionGrade
 * 如果都指定以layer为准
 * 如果都不指定,默认展示该节点的下一layer
 * subDept相当于额外的筛选条件
 * @param deptNo    部门编号
 * @param layer     组织层级,可选
 * @param subDept   下属组织,可选,如果有值则展现 subDept 为根的图谱
 * @param grade     岗级,可选,多个取值的话以逗号分隔
 * @param gradeType 岗级类型,可选,organization/employee
 * @return
 */
export async function getGraph(deptNo: string, layer: number, subDept: string, organization: string, employee: string, grade: string, gradeType: string): Promise<PojoResult<OrganizationGraphVO>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}
