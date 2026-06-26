# API 开发说明

已经预置的账号接口：

- `POST /api/auth/register`：普通用户注册，用户名重复会返回错误，密码会哈希后存入 Supabase。
- `POST /api/auth/login`：账号密码登录，成功后写入 httpOnly cookie。
- `POST /api/auth/logout`：退出登录并清除 cookie。
- `GET /api/auth/me`：读取当前登录用户，页面刷新后用它恢复登录态。

管理员账号不走网页注册。正式上线时建议由后台直接在 Supabase 中插入，或写一次性脚本创建。

已预置的核心业务接口：

- `PUT /api/me/seat`：审核通过用户保存自己的座位，带重复座位校验。
- `POST /api/admin/users/[userId]/approve`：管理员审核通过。
- `POST /api/admin/users/[userId]/reject`：管理员打回，并要求填写原因。
- `POST /api/admin/users/[userId]/deactivate`：管理员注销用户。
- `PUT /api/admin/users/[userId]/seat`：管理员帮用户修改座位，带重复座位校验。

下一批接口：

- `GET /api/proof-fields`：读取当前自证项。
- `POST /api/me/proof`：用户提交 / 重新提交自证。
- `POST /api/admin/proof-fields`：管理员新增自证项。
- `DELETE /api/admin/proof-fields/[fieldId]`：管理员删除自证项。

下一批接口：

- 图片上传到 Supabase Storage
- 管理员场馆区域配置
- 管理员统计和全区座位图


本轮新增：

- `POST /api/me/proof/upload`：用户上传自证截图到私有 Storage。
- `POST /api/admin/proof-files/sign`：管理员临时查看自证截图。
- `GET /api/admin/stats`：管理员统计总人数和分区人数。
- `GET /api/admin/seatmap/[zoneName]`：管理员查看某区完整座位图数据。
- `GET /api/zones`：读取场馆区域配置。
- `GET /api/me/nearby`：用户只读取同区前后 5 排、左右 10 号以内的同担。
