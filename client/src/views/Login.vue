const handleLogin = async () => {
  try {
    const response = await login({
      username: form.username,
      password: form.password,
      code: form.code
    });
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('userInfo', JSON.stringify(response.userInfo));
    
    // 根据用户角色跳转到不同页面
    if (response.userInfo.isAdmin || response.userInfo.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (error) {
    ElMessage.error(error.message || '登录失败');
  }
}; 