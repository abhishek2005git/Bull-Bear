'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'
import NavItems from './NavItems'
import { signOut } from '@/lib/actions/auth.actions'

const UserDropdown = ({ user }: { user: User }) => {

  const router = useRouter();

  const handleSignOut = async() => {
    await signOut();
    router.push("/sign-in");
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='flex items-center bg-gray-800 gap-3 text-gray-4 hover:bg-gray-700'>
          <Avatar className='w-8 h-8'>
            <AvatarImage src="https://github.com/shadcn.png" alt={user.name} />
            <AvatarFallback className='bg-yellow-500 text-yellow-900 text-sm font-bold'>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='hidden md:flex flex-col items-start'>
            <span className='text-base font-medium text-gray-400'>{user.name}</span>
          </div>

        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='text-gray-400'>

        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
          <Avatar className='w-10 h-10'>
            <AvatarImage src="https://github.com/shadcn.png" alt={user.name} />
            <AvatarFallback className='bg-yellow-500 text-yellow-900 text-sm font-bold'>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col '>
            <span className='text-base font-medium text-gray-400'>{user.name}</span>
            <span className='text-sm font-normal text-gray-500'>{user.email}</span>
          </div>
        </div>
        </DropdownMenuLabel >
        <DropdownMenuSeparator className='bg-gray-600' />
        <DropdownMenuItem 
          className='text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer'
          onClick={handleSignOut}
        >
          <LogOut className='mr-2 h-4 w-4 hidden sm:block' />
          Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator className='bg-gray-600 hidden sm:block' />
        <nav className="sm:hidden">
          <NavItems />
        </nav>

        
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown