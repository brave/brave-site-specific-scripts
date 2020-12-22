/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tippingIconSvg = '<svg fill="inherit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.821 11.1L8.075 6.732v-2.38l4.917 8.195-2.17-1.447zm-6.03.965h5.397l1.752 1.168H2.747l2.043-1.168zm2.13-5.333L4.187 11.08l-1.983 1.133 4.717-7.861v2.38zm.577 1.251l1.841 2.928H5.657l1.841-2.928zm7.42 5.53L7.993 1.97c-.018-.03-.043-.054-.066-.08a.568.568 0 00-.429-.2.57.57 0 00-.43.2c-.022.026-.047.05-.064.08L.079 13.513a.59.59 0 00-.061.143c-.002.004-.002.007-.002.01a.571.571 0 00-.008.237.56.56 0 00.064.193c.01.017.023.029.034.044.02.026.037.055.06.077.021.022.047.038.071.057.017.011.031.025.048.035.027.016.056.025.085.036.018.007.035.016.054.022a.597.597 0 00.132.017c.006 0 .012.003.017.003h13.85a.576.576 0 00.495-.874z" fill="#6A7684"/></svg>'

export const getTippingIconDataURL = () => {
  return `url("data:image/svg+xml,${encodeURIComponent(tippingIconSvg)}")`
}
