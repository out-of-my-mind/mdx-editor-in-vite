import ENV from '../env'

const url = ENV.VITE_PRESS_ENV_API
export default {
  async paths() {
    const pkgs = await (
      await fetch(`http://${url}/vitepress/GetVitePressRoute?type='#link_txt#'`)
    ).json()
    return pkgs.data.map((pkg) => {
      return {
        params: {
          '#link_txt#': pkg.title,
        },
        content: pkg.content
      }
    })
  }
}