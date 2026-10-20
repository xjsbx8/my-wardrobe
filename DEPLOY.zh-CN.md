# 阿里云服务器部署（Ubuntu）

本项目有网页、图片处理 API 和本地图片数据，不能只上传 `dist/`。源码包提供 `npm run start`，在服务器上监听 `127.0.0.1:3000`；由 Caddy 负责 HTTPS、访问密码与反向代理。

## 1. 准备服务器

- 准备 Ubuntu 服务器、一个解析到服务器公网 IP 的域名，并安装 Node.js **22 或更新版本**、npm、unzip、Caddy。运行 `node -v`、`npm -v`、`caddy version` 确认。
- ECS 的安全组或轻量应用服务器的防火墙仅需放行公网 TCP **80、443**；不要向公网开放 3000。SSH 端口只允许可信 IP。
- 如果服务器位于中国内地，网站对外提供服务前应按阿里云要求完成 ICP 备案。

参考：[阿里云 ECS 安全组](https://help.aliyun.com/zh/ecs/user-guide/start-using-security-groups)、[轻量服务器防火墙](https://help.aliyun.com/zh/simple-application-server/user-guide/manage-the-firewall-of-a-server)、[Caddy 安装](https://caddyserver.com/docs/install)、[阿里云备案说明](https://help.aliyun.com/zh/icp-filing/basic-icp-service/getting-started/quick-start-for-icp-filing-for-personal-websites)。

## 2. 上传、安装和构建

先把 `wardrobe-zh-CN-source.zip` 上传到服务器当前用户的主目录，再在服务器执行：

```bash
mkdir -p ~/apps ~/wardrobe-data
chmod 700 ~/wardrobe-data
unzip -q ~/wardrobe-zh-CN-source.zip -d ~/apps
mv ~/apps/wardrobe-zh-CN ~/apps/wardrobe
cd ~/apps/wardrobe
npm ci
npm run build
```

图片、导入任务、`settings.json` 和 API Key 保存在 `~/wardrobe-data`。不要把这个目录放入公开网页目录，也不要提交到 Git。

## 3. 设置开机自启

先运行 `whoami` 和 `command -v node`，把结果及项目绝对路径填入下面的模板，保存为 `/etc/systemd/system/wardrobe.service`：

```ini
[Unit]
Description=Wardrobe
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=你的Linux用户名
WorkingDirectory=/home/你的Linux用户名/apps/wardrobe
Environment=NODE_ENV=production
Environment=WARDROBE_HOST=127.0.0.1
Environment=WARDROBE_PORT=3000
Environment=WARDROBE_DATA_DIR=/home/你的Linux用户名/wardrobe-data
ExecStart=/usr/bin/node /home/你的Linux用户名/apps/wardrobe/server.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

如果 `command -v node` 不是 `/usr/bin/node`，修改 `ExecStart` 的可执行文件路径。然后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wardrobe
curl http://127.0.0.1:3000/api/import/config
sudo journalctl -u wardrobe -n 50 --no-pager
```

`curl` 应返回包含 `provider` 等字段的 JSON。如果启动失败，先看 `journalctl` 的报错。

## 4. 配置 HTTPS 和访问密码

运行 `caddy hash-password`，输入一个强密码，把输出的**哈希值**填入 `/etc/caddy/Caddyfile`：

```caddyfile
wardrobe.example.com {
    basic_auth {
        wardrobe 把密码哈希填在这里
    }
    reverse_proxy 127.0.0.1:3000
}
```

把 `wardrobe.example.com` 换成你已解析的域名。验证并重载配置：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

域名解析正确且 80/443 可访问时，Caddy 会自动申请和续期 HTTPS 证书。访问 `https://你的域名`，输入访问密码后，在网页“设置”里配置识图与生图密钥。Caddy 的访问密码保护整个网站，包括照片、设置和 API；本项目自身没有用户登录系统。

## 手机与数据说明

页面包含手机宽度布局、触屏可点的上传按钮和系统照片选择器。手机浏览器访问同一 HTTPS 域名即可使用。照片导入记录保存在服务器，手机和电脑能看到同一批已导入衣物；**衣物名称、分类、颜色、标签的后续修改仍使用各浏览器自己的 `localStorage`，目前不会在设备间同步**。网页在 520px、580px、860px 等宽度有响应式样式，但仍建议在你的实际手机上检查长文本、照片选择和审核弹层。

定期备份 `~/wardrobe-data`。升级源码时先备份该目录，重新安装依赖并构建，再运行 `sudo systemctl restart wardrobe`。上传照片的请求体上限为 25 MiB；手机原图太大时先压缩。
