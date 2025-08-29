import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <div className='max-w-6xl mx-auto p-4 space-y-8 mb-12 flex flex-row items-center justify-start gap-2'>
        <div className='h-12 w-[100%] p-2 flex flex-col items-start justify-start gap-2'>
            <img src="/logo1.png" alt="logo" className='h-full ml-8'/>
            <div className='w-[100%] p-2 shadow flex justify-between items-center'>
                <img src="/logo2.png" alt="logo" className='w-[100px]'/>
                <div>
                   <Link to="/dashboard" className='text-sm'>DashBoard</Link>
                   <Link to="/rooms/new" className='ml-4 text-sm'>Add Room</Link>
                   <Link to="/bookings" className='ml-4 text-sm'>Bookings</Link>
                   <Link to="/users" className='ml-4 text-sm'>Users</Link>
                   <Link to="/logout" className='ml-4 text-sm'>Logout</Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Header
