export interface BaseLoginController {
  request: HttpServletRequest;
  response: HttpServletResponse;
  aclService: PermissionQueryServiceImpl;
}
