/**
 * Java 描述信息
 */
export interface IJavaDescription {
  /**
   * 注释内容
   */
  text: string;

  /**
   * 注释中的 tag 信息，Exp: @Description 后端
   * 考虑回存在 @param 标签会存在多个，所以 tag 后的值为数组，Exp:
   * \@param deptNo    部门编号
   * \@param layer     组织层级,可选
   * \@param subDept   下属组织,可选,如果有值则展现 subDept 为根的图谱
   * 对应的存储格式为：
   * {
   *     param: [
   *      "deptNo    部门编号",
   *      "layer     组织层级,可选",
   *      "subDept   下属组织,可选,如果有值则展现 subDept 为根的图谱"
   *     ]
   * }
   */
  tag: {
    [key: string]: string[];
  }
}
