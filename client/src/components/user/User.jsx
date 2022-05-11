import React from 'react';

import { constant, utils } from '../../shared/index';

export default class User extends React.Component {
  
  render() {
    return (
      <div className="le_login-wrapper">
        <div className="le_signup-block w-100 le_overflow-hide">
          <div className="container-fluid">
            <div className="le_signup-inner le_row le_h-100vh">
              <div className="le_row-blocks le_signleft-row le_col-md-6 le_flex-hcenter">
                <div className="le_signleft-inner">
                  <div className="le_signleft-text le_p-2">
                    <div className="le_signleft-image">
                      <img onClick={() => utils.goToHome()} src={constant['IMG_PATH'] + 'logo-white@2x.png'} alt="leably-white-logo" className="img-responsive logo le_m-auto" width="180" height="47" />
                    </div>
                    <div className="le_sign-box le_bg-white le_p-5">
                      <div className="le_signleft-heading le_mb-3"><span className="le_light-heading le_w-100 le_d-block le_font-regular le_line-height-n le_font-italic ">Find the best</span> legal job</div>
                      <div className="le_signleft-heading le_mb-3"><span className="le_light-heading le_w-100 le_d-block le_font-regular le_line-height-n le_font-italic ">Hire the best</span> attorney</div>
                      <p className="le_sign-desc font-14 le_f-light le_text-black">Legably is the modern online legal staffing platform that connects attorneys seeking work with other attorneys and firms in need of their services.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="le_signright-row le_row-blocks le_col-md-6 le_flex-hcenter">
              <div className="le_joinus le_position-absolute le_tbrl-0">
                  <h1 className="le-joinus-text le_f-bold  le_typing">JOIN US</h1>
                </div>
              <div className="le_signin-in-box">
                <div className="le_signright-box le_bg-white le_px-5 le_py-3 le_z-index">
                  {this.props.children}
                </div>
                <div className="le_girl-img le_position-absolute le_d-md-none le_d-lg-block">
                <img src={constant['IMG_PATH'] + 'Lady-signin.png'} alt="Lady-signin-image" className="Lady-signin le_img-fluid" />
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// import React from 'react';

// import { constant, utils } from '../../shared/index';

// export default class User extends React.Component {
//   render() {
//     return (
//       <div className="user-login-wrapper">
//         <section className="left-banner pull-left forgot-pwd-banner reset-link-banner">
//           <div>
//             <img onClick={() => utils.goToHome()} src={constant['IMG_PATH'] + 'logo-white@2x.png'} alt="leably-white-logo" className="img-responsive logo" width="180" height="47" />
//             <h3>Find the best legal job</h3>
//             <h3>Hire the best attorney</h3>
//             <p>Legably is the modern online legal staffing platform that connects attorneys seeking work with other attorneys and firms in need of their services.</p>
//           </div>
//         </section>

//         {this.props.children}

//         <section className="clearfix"></section>
//       </div>
//     );
//   }
// }
