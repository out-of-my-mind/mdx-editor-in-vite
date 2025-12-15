export default {
  async paths() {
    const pkgs = await (await fetch('http://127.0.0.1:5000/vitepress/GetVitePressRoute')).json()
    return JSON.parse(pkgs).map((pkg) => {
      return {
        params: {
          cost: pkg.title,
        },
        content: pkg.content
      }
    })
  }
}