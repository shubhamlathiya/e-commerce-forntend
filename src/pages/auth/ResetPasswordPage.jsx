import React, { useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearMessages, resetPassword, setResetField } from "../../features/auth/authSlice";
import {Icon} from "@iconify/react";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const ResetPasswordPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const query = useQuery();
    const { resetForm, status, error, success } = useSelector((s) => s.auth);

    useEffect(() => {
        const token = query.get("token");
        if (token) dispatch(setResetField({ field: "token", value: token }));
    }, [dispatch, query]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (resetForm.password !== resetForm.confirmPassword) {
            return alert("Passwords do not match");
        }
        dispatch(resetPassword({ token: resetForm.token, password: resetForm.password }));
    };

    useEffect(() => {
        if (status === "succeeded" && success) {
            const t = setTimeout(() => navigate("/sign-in"), 600);
            return () => clearTimeout(t);
        }
    }, [status, success, navigate]);

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
                        <h4 className='mb-12'>Reset Password</h4>
                        <p className='mb-24 text-secondary-light text-lg'>Set a new password for your account</p>
                    </div>
                    {error && <div className='alert alert-danger' role='alert'>{String(error)}</div>}
                    {success && <div className='alert alert-success' role='alert'>{String(success)}</div>}
                    <form onSubmit={handleSubmit}>
                        {!resetForm.token && (
                            <div className='icon-field mb-16'>
                <span className='icon top-50 translate-middle-y'>
                  <Icon icon='solar:key-linear' />
                </span>
                                <input
                                    type='text'
                                    className='form-control h-56-px bg-neutral-50 radius-12'
                                    placeholder='Reset token'
                                    value={resetForm.token}
                                    onChange={(e) => dispatch(setResetField({ field: "token", value: e.target.value }))}
                                    required
                                />
                            </div>
                        )}

                        <div className='position-relative mb-16'>
                            <div className='icon-field'>
                <span className='icon top-50 translate-middle-y'>
                  <Icon icon='solar:lock-password-outline' />
                </span>
                                <input
                                    type='password'
                                    className='form-control h-56-px bg-neutral-50 radius-12'
                                    id='reset-password'
                                    placeholder='New Password'
                                    value={resetForm.password}
                                    onChange={(e) => dispatch(setResetField({ field: "password", value: e.target.value }))}
                                    required
                                />
                            </div>
                            <span className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light' data-toggle='#reset-password' />
                        </div>

                        <div className='position-relative mb-16'>
                            <div className='icon-field'>
                <span className='icon top-50 translate-middle-y'>
                  <Icon icon='solar:lock-password-outline' />
                </span>
                                <input
                                    type='password'
                                    className='form-control h-56-px bg-neutral-50 radius-12'
                                    id='confirm-password'
                                    placeholder='Confirm Password'
                                    value={resetForm.confirmPassword}
                                    onChange={(e) => dispatch(setResetField({ field: "confirmPassword", value: e.target.value }))}
                                    required
                                />
                            </div>
                            <span className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light' data-toggle='#confirm-password' />
                        </div>

                        <button type='submit' className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-8' disabled={status === "loading"}>
                            {status === "loading" ? "Resetting..." : "Reset Password"}
                        </button>

                        <div className='mt-20 text-center text-sm'>
                            <p className='mb-0'>Remember your password? {" "}
                                <Link to='/sign-in' className='text-primary-600 fw-semibold'>Sign In</Link>
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

export default ResetPasswordPage;

