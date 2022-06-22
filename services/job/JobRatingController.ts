export async function upload(file: MultipartFile): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function uploadYearGrade(file: MultipartFile): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function query(workNo: string, grades: Array<string>, groupLabel: string, userDefinedLabel1: string, year: string, objType: string, deptNoLayer1: string, currentPage: number, pageSize: number, version: string): Promise<PageResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function add(requestVo: PositionGradeSaveRequest): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function update(requestVo: PositionGradeSaveRequest): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function deleteJob(workNo: string, objType: string): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 导出特定版本的岗级记录
 * @param workNo
 * @param grades
 * @param deptNoLayer1
 * @param version
 */
export async function downloadCurrent(workNo: string, grades: Array<string>, deptNoLayer1: string, version: string): Promise<void> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 导出岗级变更记录
 * @param workNo
 * @param grades
 * @param deptNoLayer1
 */
export async function downloadHistoryChangeList(workNo: string, grades: Array<string>, deptNoLayer1: string): Promise<void> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function download(workNo: string, grades: Array<string>, year: string, isGrade: string, objType: string, deptNoLayer1: string): Promise<void> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/** @param objType currentGrade,yearGrade,historyGrade */
export async function downloadTemplate(objType: string): Promise<void> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function listDepartments(objType: string): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function getDataPermission(): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * @param workNo        筛选：目标工号
 * @param year          筛选：财年年度，如FY22
 * @param deptNo        筛选：部门编码
 * @param grades        筛选：岗级，如多个英文逗号分隔
 * @param yearGrades    筛选：年度岗级，如多个英文逗号分隔
 * @param currentPage   页码
 * @param pageSize      分页大小
 * @param sortField     排序字段，即VO返回的字段
 * @param sortDirection 排序方向，asc，desc
 * @param levels        筛选：层级，如多个英文逗号分隔
 * @param managerWorkNo 筛选：主管工号
 * @return
 */
export async function queryListForTlWorkbench(workNo: string, year: string, deptNo: Array<string>, deptName: string, grades: Array<string>, yearGrades: Array<string>, levels: Array<string>, managerWorkNo: Array<string>, jobCodeType: Array<string>, groupLabel: string, sortField: string, sortDirection: string, currentPage: number, pageSize: number): Promise<PageResult<StaffJobRatingCombinedVo>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function searchDepartment(keyword: string): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function listSelectableYears(): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function listSelectableGrades(): Promise<PojoResult<Array<ImmutableMap<string, string>>>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 列出层级标签和业务定义的复合标签
 * @return
 */
export async function listSelectableLevels(): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function listSelectableJobCodeTypes(): Promise<PojoResult> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 取人员岗级的快照版本列表(current表示当前生效版本,202202/202201表示每月底生成的snapshot)
 * @return
 */
export async function listEmpPositionVersion(): Promise<PojoResult<Array<ImmutableMap<string, string>>>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 检查用户是否是超级管理员
 * @return
 */
export async function checkSuperAdmin(): Promise<PojoResult<boolean>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function lisGroupLabel(): Promise<PojoResult<Array<ImmutableMap<string, string>>>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

export async function listUserDefinedLabel1(): Promise<PojoResult<Array<ImmutableMap<string, string>>>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}
