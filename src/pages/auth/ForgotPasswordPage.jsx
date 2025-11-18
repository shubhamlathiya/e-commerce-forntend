import React from "react";

import {Link} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearMessages, forgotPassword, setForgotField} from "../../features/auth/authSlice";
import {Icon} from "@iconify/react";

const ForgotPasswordPage = () => {
    const dispatch = useDispatch();
    const {forgotForm, status, error, success} = useSelector((s) => s.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(forgotPassword(forgotForm));
    };

    return (
        <>
            <section className="auth forgot-password-page bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 justify-content-center">
                        <img src="assets/images/auth/forgot-pass-img.png" alt=""/>
                    </div>
                </div>
                <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
                    <div className="max-w-464-px mx-auto w-100">
                        <div>
                            <h4 className="mb-12">Forgot Password</h4>
                            <p className="mb-24 text-secondary-light text-lg">
                                Enter the email associated with your account to receive a reset link.
                            </p>
                        </div>

                        {error && <div className='alert alert-danger' role='alert'>{String(error)}</div>}
                        {success && <div className='alert alert-success' role='alert'>{String(success)}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="icon-field">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="mage:email"/>
                </span>
                                <input
                                    type="email"
                                    className="form-control h-56-px bg-neutral-50 radius-12"
                                    placeholder="Enter Email"
                                    value={forgotForm.email}
                                    onChange={(e) => dispatch(setForgotField({field: "email", value: e.target.value}))}
                                    required
                                />
                            </div>
                            <button type="submit"
                                    className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-24"
                                    disabled={status === "loading"}>
                                {status === "loading" ? "Sending..." : "Continue"}
                            </button>
                            <div className="text-center">
                                <Link to="/sign-in" className="text-primary-600 fw-bold mt-24">
                                    Back to Sign In
                                </Link>
                            </div>
                            <div className="mt-40 text-center text-sm">
                                <p className="mb-0">
                                    Already have an account?{" "}
                                    <Link to="/sign-in" className="text-primary-600 fw-semibold">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </form>

                        {(error || success) && (
                            <div className='mt-12 text-end'>
                                <button className='btn btn-neutral-400 btn-sm'
                                        onClick={() => dispatch(clearMessages())}>Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
};

export default ForgotPasswordPage;

