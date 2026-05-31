package com.pulsecheck.auth.mapper;

import com.pulsecheck.auth.dto.UserDto;
import com.pulsecheck.auth.entity.Role;
import com.pulsecheck.auth.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    @Mapping(target = "roles", expression = "java(mapRolesToStrings(entity.getRoles()))")
    UserDto toDto(User entity);
    
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "roles", expression = "java(mapStringsToRoles(dto.getRoles()))")
    User toEntity(UserDto dto);
    
    List<UserDto> toDtoList(List<User> entityList);
    
    List<User> toEntityList(List<UserDto> dtoList);
    
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "roles", expression = "java(mapStringsToRoles(dto.getRoles()))")
    void updateEntity(UserDto dto, @MappingTarget User entity);

    default Set<String> mapRolesToStrings(Set<Role> roles) {
        if (roles == null) return Collections.emptySet();
        return roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
    }

    default Set<Role> mapStringsToRoles(Set<String> roles) {
        if (roles == null) return Collections.emptySet();
        return roles.stream()
                .map(roleName -> Role.builder().name(roleName).build())
                .collect(Collectors.toSet());
    }
}
