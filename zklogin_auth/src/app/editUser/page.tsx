"use client"
import { useState } from 'react';
import axios from 'axios';

export default function Edit() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [onlineAvatar, setOnlineAvatar] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // 添加状态以存储错误信息
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // 成功信息
    const [sizeError, setSizeError] = useState<string | null>(null);

    const handleSubmit = async () => {
        // 创建 JSON 对象
        let data = {}
        if (onlineAvatar) {
            data = {
                image_base64: onlineAvatar,
                name: name,
                email: email,
            }
        } else if (imageSrc) {
            data = {
                image_base64: imageSrc,
                name: name,
                email: email,
            }
        } else {
            setErrorMessage("Please check your avatar.")
            return;
        }
        // 提交 JSON 数据
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_HOST}/getSBT`, data)
            const json_data = response.data
            // 处理响应
            if (json_data.success) {
                setSuccessMessage("Login success, please manual refresh page !!!")
                setErrorMessage(null); // 清除错误信息
                setName(null)
                setEmail(null)
                setImageSrc(null)
                setOnlineAvatar(null)
                setSizeError(null)
            } else {
                setErrorMessage(json_data.error || 'Please try again later.'); // 设置错误信息
            }
            console.log(response);
        } catch (error) {
            setErrorMessage('Meet some errors')
            console.log(error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; // 获取用户选择的文件
        if (file) {
            if (file.size > 10000) {
                setSizeError('Your pick image is too large')
            } else {
                setSizeError(null)
            }
            console.log(`File size: ${file.size} bytes`); // 打印文件大小
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                console.log(base64String.length);
                setImageSrc(base64String); // 更新状态以存储图片
            };
            reader.readAsDataURL(file); // 读取文件为 Data URL
        }
    };

    function sendMessageToCocos() {
        document.location = 'testkey://a=1&b=2';
    }


    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
            <form className="bg-white p-6 rounded-lg shadow-md flex flex-col space-y-4 h-screen w-screen">
                <div className="flex items-center">
                    <input type="file" placeholder='Please select your avatar from your phone' accept="image/*" name="avatar" onChange={handleFileChange} disabled={onlineAvatar !== null && onlineAvatar !== ""} className="border border-gray-300 rounded-md p-2 text-black" />
                    <button type="button" onClick={() => {
                        setImageSrc(null)
                        setSizeError(null)
                    }} className="ml-2 text-red-500">X</button> {/* 添加 X 按钮 */}
                </div>
                <p className="text-xs text-red-500">Online image or local image you can choice one.If you want to use local image as avatar the image size need to small than 10KB</p>
                <input type="text" value={onlineAvatar ?? ""} onChange={(e) => { setOnlineAvatar(e.target.value) }} name="avatarOnline" disabled={imageSrc !== null && imageSrc !== ''} placeholder="avatar from online" className="border border-gray-300 rounded-md p-2 text-black" />
                <input type="text" value={name ?? ""} onChange={(e) => { setName(e.target.value) }} name="username" placeholder="name" required className="border border-gray-300 rounded-md p-2 text-black" />
                <input type="email" value={email ?? ""} onChange={(e) => { setEmail(e.target.value) }} name="email" placeholder="email" required className="border border-gray-300 rounded-md p-2 text-black" />
                <button type="button" onClick={() => { handleSubmit() }} disabled={sizeError !== null} className={`text-white rounded-md p-2 hover:bg-blue-600 transition ${sizeError ? "bg-gray-500" : 'bg-blue-500'}`}>submit</button>
                {sizeError && ( // 条件渲染错误信息
                    <div className="text-red-500 mt-4 text-xs font-bold">{sizeError}</div>
                )}
                {imageSrc && (
                    <>
                        <div className="text-2xl font-bold text-blue-500">Your avatar:</div>
                        <img src={imageSrc} alt="Uploaded" className="mt-4 rounded-md" />
                    </>
                )}
                {errorMessage && ( // 条件渲染错误信息
                    <div className="text-red-500 mt-4">{errorMessage}</div>
                )}
                {successMessage && ( // 成功渲染
                    <div className="text-red-500 mt-4 font-bold text-center">{successMessage}</div>
                )}
                <button type="button" onClick={() => {
                    sendMessageToCocos()
                }} className={`text-white hidden rounded-md p-2 hover:bg-blue-600 transition ${sizeError ? "bg-gray-500" : 'bg-blue-500'}`}>test</button>
            </form>
        </div>
    )
}