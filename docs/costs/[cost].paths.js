import ENV from '../env'

const url = ENV.VITE_PRESS_ENV_API
export default {
  async paths() {
    const pkgs = await (
      await fetch(`http://${url}/vitepress/GetVitePressRoute`)
    ).json()
    return pkgs.data.map((pkg) => {
      return {
        params: {
          cost: pkg.title,
        },
        content: pkg.content
      }
    })
  }
}