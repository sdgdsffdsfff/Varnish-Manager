# Varnish-Manager
基于Nodejs的Varnish 管理工具，功能支持，get url, purge url.

## 原理

1.  CheckUrl：在ip 的请求上加个host，类似curl -H "Host:www.XXXX.com" http://ip:port 
2.  Purge：telnet 至 Varnishserver的 VarnishAdm 管理端口进行 ban操作。


## 结构图

![image](https://raw.githubusercontent.com/bcguan2008/Varnish-Manager/master/document/VarnishManager.jpg)
