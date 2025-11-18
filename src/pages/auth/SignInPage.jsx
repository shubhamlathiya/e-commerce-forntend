import React, { useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {clearMessages, login, setLoginField} from "../../features/auth/authSlice";
import {Icon} from "@iconify/react";


const SignInPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loginForm, status, error, success, user, requires2FA, twoFAUserId, twoFAMethod } = useSelector((s) => s.auth);

    useEffect(() => {
        if (status === "succeeded" && requires2FA) {
            // Persist pending 2FA info for the authenticate page
            if (twoFAUserId) localStorage.setItem("pending_2fa_userId", String(twoFAUserId));
            if (twoFAMethod) localStorage.setItem("pending_2fa_method", String(twoFAMethod));
            const timer = setTimeout(() => navigate("/2fa/authenticate", { replace: true, state: { userId: twoFAUserId, method: twoFAMethod } }), 300);
            return () => clearTimeout(timer);
        }
        if (status === "succeeded" && user) {
            const timer = setTimeout(() => navigate("/tags"), 300);
            return () => clearTimeout(timer);
        }
    }, [status, user, requires2FA, twoFAUserId, twoFAMethod, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login(loginForm));
    };

    return (
        <section className='auth bg-base d-flex flex-wrap'>
            <div className='auth-left d-lg-block d-none'>
                <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
                    <img src='assets/images/auth/auth-img.png' alt='' />
                </div>
            </div>
            <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
                <div className='max-w-464-px mx-auto w-100'>
                    <div>
                        <Link to='/' className='mb-40 max-w-290-px'>
                            <img src='assets/images/logo.png' alt='' />
                        </Link>
                        <h4 className='mb-12'>Sign In to your Account</h4>
                        <p className='mb-24 text-secondary-light text-lg'>Welcome back! please enter your detail</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">{String(error)}</div>
                    )}
                    {success && (
                        <div className="alert alert-success" role="alert">{String(success)}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>
                            <input
                                type='email'
                                className='form-control h-56-px bg-neutral-50 radius-12'
                                placeholder='Email (optional)'
                                value={loginForm.email}
                                onChange={(e) => dispatch(setLoginField({ field: "email", value: e.target.value }))}
                            />
                        </div>

                        <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='solar:phone-outline' />
              </span>
                            <input
                                type='tel'
                                className='form-control h-56-px bg-neutral-50 radius-12'
                                placeholder='Phone (optional)'
                                value={loginForm.phone}
                                onChange={(e) => dispatch(setLoginField({ field: "phone", value: e.target.value }))}
                            />
                        </div>

                        <div className='position-relative mb-20'>
                            <div className='icon-field'>
                <span className='icon top-50 translate-middle-y'>
                  <Icon icon='solar:lock-password-outline' />
                </span>
                                <input
                                    type='password'
                                    className='form-control h-56-px bg-neutral-50 radius-12'
                                    id='login-password'
                                    placeholder='Password'
                                    value={loginForm.password}
                                    onChange={(e) => dispatch(setLoginField({ field: "password", value: e.target.value }))}
                                    required
                                />
                            </div>
                            <span
                                className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light'
                                data-toggle='#login-password'
                            />
                        </div>

                        <div className='d-flex justify-content-between gap-2'>
                            <Link to='/forgot-password' className='text-primary-600 fw-medium'>
                                Forgot Password?
                            </Link>
                        </div>

                        <button type='submit' className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-24' disabled={status === "loading"}>
                            {status === "loading" ? "Signing In..." : "Sign In"}
                        </button>

                        <div className='mt-32 text-center text-sm'>
                            <p className='mb-0'>
                                Don’t have an account? {" "}
                                <Link to='/sign-up' className='text-primary-600 fw-semibold'>
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </form>

                    {(error || success) && (
                        <div className='mt-12 text-end'>
                            <button className='btn btn-neutral-400 btn-sm' onClick={() => dispatch(clearMessages())}>Clear</button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default SignInPage;

