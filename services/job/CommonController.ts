/**
 * 搜索员工
 * @param key 员工工号,名字关键字
 * @return 下属员工列表
 */
export async function search(key: string): Promise<CollectionResult<SearchEmployeeInfo>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}

/**
 * 数字水印
 * @param request
 * @param response
 * @return
 */
export async function watermark(request: HttpServletRequest, response: HttpServletResponse): Promise<PojoResult<string>> {
  const myNumber = 5;
  if (myNumber === 5) {
    console.log('yes')
  }
}
