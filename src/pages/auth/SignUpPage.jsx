import React from "react";

import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearMessages, register, resendVerification, setRegisterField } from "../../features/auth/authSlice";
import {Icon} from "@iconify/react";

const SignUpPage = () => {
    const dispatch = useDispatch();
    const { registerForm, status, error, success } = useSelector((s) => s.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(register(registerForm));
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
                        <h4 className='mb-12'>Sign Up to your Account</h4>
                        <p className='mb-24 text-secondary-light text-lg'>Create your account to get started</p>
                    </div>

                    {error && <div className='alert alert-danger' role='alert'>{String(error)}</div>}
                    {success && <div className='alert alert-success' role='alert'>{String(success)}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='f7:person' />
              </span>
                            <input
                                type='text'
                                className='form-control h-56-px bg-neutral-50 radius-12'
                                placeholder='Full Name'
                                value={registerForm.name}
                                onChange={(e) => dispatch(setRegisterField({ field: "name", value: e.target.value }))}
                                required
                            />
                        </div>

                        <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>
                            <input
                                type='email'
                                className='form-control h-56-px bg-neutral-50 radius-12'
                                placeholder='Email'
                                value={registerForm.email}
                                onChange={(e) => dispatch(setRegisterField({ field: "email", value: e.target.value }))}
                                required
                            />
                        </div>

                        <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='solar:phone-outline' />
              </span>
                            <input
                                type='tel'
                                className='form-control h-56-px bg-neutral-50 radius-12'
                                placeholder='Phone'
                                value={registerForm.phone}
                                onChange={(e) => dispatch(setRegisterField({ field: "phone", value: e.target.value }))}
                                required
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
                                    id='signup-password'
                                    placeholder='Password'
                                    value={registerForm.password}
                                    onChange={(e) => dispatch(setRegisterField({ field: "password", value: e.target.value }))}
                                    required
                                />
                            </div>
                            <span className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light' data-toggle='#signup-password' />
                            <span className='mt-8 text-sm text-secondary-light d-block'>Your password must have at least 8 characters</span>
                        </div>

                        <button type='submit' className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-8' disabled={status === "loading"}>
                            {status === "loading" ? "Creating..." : "Sign Up"}
                        </button>

                        <div className='mt-20 text-center text-sm'>
                            <p className='mb-0'>Already have an account? {" "}
                                <Link to='/sign-in' className='text-primary-600 fw-semibold'>Sign In</Link>
                            </p>
                        </div>
                    </form>

                    <div className='mt-20 text-end'>
                        {(error || success) && (
                            <div className='d-flex gap-2 justify-content-end'>
                                <button className='btn btn-neutral-400 btn-sm' onClick={() => dispatch(clearMessages())}>Clear</button>
                                <button className='btn btn-outline-primary-600 btn-sm' onClick={() => dispatch(resendVerification({ email: registerForm.email, phone: registerForm.phone }))}>Resend OTP</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SignUpPage;

