Collaborative online 3D voxel environment editor.

https://pixelscape.herokuapp.com

### Resolving yarn.lock conflicts

From https://github.com/yarnpkg/yarn/issues/1776#issuecomment-269539948

>The approach that has worked for me so far is this:
>
>`git rebase origin/master`
>
>When the first conflict arises, I checkout the yarn.lock then re-perform the installation
>
>```
>git checkout origin/master -- yarn.lock
>yarn install
>```
>This generates a new yarn.lock based on the origin/master version of yarn.lock, but including the changes I made to >my package.json. Then it's just a matter of:
>
>```
>git add yarn.lock
>git rebase --continue
>```
>
>And I'm back in business. 
