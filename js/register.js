var vm = new Vue({
    el: '#app',
    data: {
        // host:host,
        host,
        error_name: false,
        error_password: false,
        error_check_password: false,
        error_phone: false,
        error_allow: false,
        error_sms_code: false,
        sending_flag: false,

        username: '',
        password: '',
        password2: '',
        mobile: '',
        sms_code: '',
        allow: false,
        sms_code_tip: '获取短信验证码',  // a标签文字
        error_sms_code_message: '',  // 验证码错误提示信息
        error_name_message: '',
        error_phone_message: '',

    },
    methods: {
        // 检查用户名
        check_username: function () {
            const len = this.username.length;
            if (len < 5 || len > 20) {
                this.error_name_message = '请输入5-20个字符的用户名';
                this.error_name = true;
            } else {
                this.error_name = false;
            }
            // 检查重名
            if (this.error_name === false) {
                axios.get(this.host + '/username/' + this.username + '/count/', {
                    responseType: 'json'
                })
                    .then(response => {
                        if (response.data.count > 0) {
                            this.error_name_message = '用户名已存在';
                            this.error_name = true;
                        } else {
                            this.error_name = false;
                        }
                    })
                    .catch(error => {
                        console.log(error.response.data);
                    })
            }
        },
        // 校验密码是否符合格式
        check_pwd: function () {
            const len = this.password.length;
            this.error_password = len < 8 || len > 20;
        },
        // 校验两次密码是否相同
        check_cpwd: function () {
            this.error_check_password = this.password !== this.password2;
        },
        // 检查手机号
        check_phone: function () {
            const re = /^1[3-9]\d{9}$/;
            if (re.test(this.mobile)) {
                this.error_phone = false;
            } else {
                this.error_phone_message = '您输入的手机号格式不正确';
                this.error_phone = true;
            }

            //检查手机号是否存在
            if (this.error_phone === false) {
                axios.get(this.host + '/mobile/' + this.mobile + '/count/', {
                    responseType: 'json'
                })
                    .then(response => {
                        if (response.data.count > 0) {
                            this.error_phone_message = '手机号已存在';
                            this.error_phone = true;
                        } else {
                            this.error_phone = false;
                        }
                    })
                    .catch(error => {
                        console.log(error.response.data);
                    })
            }
        },
        // 校验是否有输入验证码
        check_sms_code: function () {
            this.error_sms_code = !this.sms_code;
        },
        // 校验是否勾选协议
        check_allow: function () {
            this.error_allow = !this.allow;
        },

        // 发送短信验证码
        send_sms_code: function () {
            if (this.sending_flag === true) {
                return;
            }
            this.sending_flag = true;

            // 校验参数，保证输入框有数据填写
            this.check_phone();

            if (this.error_phone === true) {
                this.sending_flag = false;
                return;
            }

            // 向后端接口发送请求，让后端发送短信验证码
            axios.get(this.host + '/sms_codes/' + this.mobile + '/', {
                responseType: 'json'
            })
                .then(response => {
                    // 表示后端发送短信成功
                    // 倒计时60秒，60秒后允许用户再次点击发送短信验证码的按钮
                    let num = 60;
                    // 设置一个计时器
                    const t = setInterval(() => {
                        if (num === 1) {
                            // 如果计时器到最后, 清除计时器对象
                            clearInterval(t);
                            // 将点击获取验证码的按钮展示的文本回复成原始文本
                            this.sms_code_tip = '获取短信验证码';
                            // 将点击按钮的onclick事件函数恢复回去
                            this.sending_flag = false;
                        } else {
                            num -= 1;
                            // 展示倒计时信息
                            this.sms_code_tip = num + '秒';
                        }
                    }, 1000);
                })
                .catch(error => {
                    if (error.response.status === 400) {
                        // 展示发送短信错误提示
                        this.error_sms_code = true;
                        this.error_sms_code_message = error.response.data.message;
                    } else {
                        console.log(error.response.data);
                    }
                    this.sending_flag = false;
                })
        },
        // 注册
        on_submit: function () {
            this.check_username();
            this.check_pwd();
            this.check_cpwd();
            this.check_phone();
            this.check_sms_code();
            this.check_allow();

            if (this.error_name === false
                &&
                this.error_password === false
                &&
                this.error_check_password === false
                &&
                this.error_phone === false
                &&
                this.error_sms_code === false
                &&
                this.error_allow === false) {

                axios.post(this.host + '/user/', {
                    username: this.username,
                    password: this.password,
                    password2: this.password2,
                    mobile: this.mobile,
                    sms_code: this.sms_code,
                    allow: this.allow.toString()
                }, {
                    responseType: 'json'
                })
                    .then(response => {
                        // 记录用户的登录状态
                        sessionStorage.clear();
                        localStorage.clear();
                        localStorage.token = response.data.token;
                        localStorage.username = response.data.username;
                        localStorage.user_id = response.data.id;
                        location.href = '/index.html';

                    })
                    .catch(error => {
                        if (error.response.status === 400) {
                            if ('non_field_errors' in error.response.data) {
                                this.error_sms_code_message = error.response.data.non_field_errors[0];
                            } else {
                                if (error.response.data["username"]) {
                                    this.error_name_message = '用户名已存在';
                                    this.error_name=true;
                                }
                                else if (error.response.data["mobile"]) {
                                    this.error_phone_message = '该手机号已被注册';
                                    this.error_phone=true;
                                }
                                else {
                                    this.error_sms_code_message = '数据有误'
                                }
                            }
                            this.error_sms_code = true;
                        } else {
                            console.log(error.response.data);
                        }
                    })
            }
        }
    }
});
