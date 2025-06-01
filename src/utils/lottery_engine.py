"""
随机抽奖引擎，实现权重抽奖算法。
"""
import logging
import random
from typing import Dict, List, Optional, Set, Tuple, Union


logger = logging.getLogger(__name__)


class LotteryEngine:
    """
    随机抽奖引擎，支持等概率和权重概率抽奖。
    """
    
    def __init__(self) -> None:
        """初始化抽奖引擎"""
        self._names: List[str] = []            # 候选名单
        self._weights: List[float] = []         # 对应权重
        self._excluded_indices: Set[int] = set()  # 已抽取的索引，用于不重复抽取
    
    def load_data(self, names: List[str], weights: Optional[List[float]] = None) -> None:
        """
        加载名单和权重数据
        
        Args:
            names: 名单列表
            weights: 权重列表，如果为None则设为等概率
        """
        if not names:
            raise ValueError("名单不能为空")
        
        self._names = list(names)
        
        # 如果没有提供权重，则设为等概率
        if weights is None:
            self._weights = [1.0] * len(names)
        else:
            # 确保权重和名单长度一致
            if len(weights) != len(names):
                logger.warning(f"权重列表长度 ({len(weights)}) 与名单长度 ({len(names)}) 不一致，使用默认权重1.0")
                self._weights = [1.0] * len(names)
            else:
                # 确保权重非负
                self._weights = [max(0.0, w) for w in weights]
        
        # 清空已排除索引
        self._excluded_indices = set()
        
        logger.info(f"已加载 {len(names)} 个候选者")
    
    def add_candidate(self, name: str, weight: float = 1.0) -> None:
        """
        添加单个候选者
        
        Args:
            name: 候选者名称
            weight: 权重值，默认为1.0
        """
        self._names.append(name)
        self._weights.append(max(0.0, weight))
    
    def remove_candidate(self, name: str) -> bool:
        """
        移除候选者
        
        Args:
            name: 候选者名称
            
        Returns:
            是否成功移除
        """
        try:
            idx = self._names.index(name)
            self._names.pop(idx)
            self._weights.pop(idx)
            
            # 更新已排除索引
            new_excluded = set()
            for i in self._excluded_indices:
                if i < idx:
                    new_excluded.add(i)
                elif i > idx:
                    new_excluded.add(i - 1)
            self._excluded_indices = new_excluded
            
            return True
        except ValueError:
            return False
    
    def draw_one(self, use_weight: bool = True, allow_repeat: bool = False) -> Optional[str]:
        """
        抽取一个候选者
        
        Args:
            use_weight: 是否使用权重
            allow_repeat: 是否允许重复抽取
            
        Returns:
            抽取的候选者名称，如果没有可抽取的候选者则返回None
        """
        # 检查是否还有可抽取的候选者
        available_indices = [i for i in range(len(self._names)) if i not in self._excluded_indices]
        
        if not available_indices:
            logger.warning("没有可抽取的候选者了")
            return None
        
        # 根据权重抽取
        if use_weight:
            # 提取可用的权重
            available_weights = [self._weights[i] for i in available_indices]
            
            # 检查是否所有权重都为0
            if sum(available_weights) == 0:
                # 如果所有权重都为0，则等概率抽取
                idx = random.choice(available_indices)
            else:
                idx = random.choices(available_indices, weights=available_weights, k=1)[0]
        else:
            # 等概率抽取
            idx = random.choice(available_indices)
        
        # 如果不允许重复，则将索引加入排除列表
        if not allow_repeat:
            self._excluded_indices.add(idx)
        
        return self._names[idx]
    
    def draw_multiple(self, count: int, use_weight: bool = True, allow_repeat: bool = False) -> List[str]:
        """
        抽取多个候选者
        
        Args:
            count: 抽取数量
            use_weight: 是否使用权重
            allow_repeat: 是否允许重复抽取
            
        Returns:
            抽取的候选者名称列表
        """
        if count <= 0:
            return []
        
        result = []
        
        # 如果允许重复，可以直接一次性抽取
        if allow_repeat and use_weight:
            # 使用权重进行重复抽取
            indices = random.choices(range(len(self._names)), weights=self._weights, k=count)
            return [self._names[i] for i in indices]
        elif allow_repeat:
            # 等概率重复抽取
            indices = random.choices(range(len(self._names)), k=count)
            return [self._names[i] for i in indices]
        
        # 不允许重复的情况，逐个抽取
        for _ in range(count):
            name = self.draw_one(use_weight=use_weight, allow_repeat=False)
            if name is None:
                break
            result.append(name)
        
        return result
    
    def reset_exclusions(self) -> None:
        """重置已排除的索引，允许重新抽取所有候选者"""
        self._excluded_indices = set()
    
    def get_remaining_count(self) -> int:
        """获取剩余可抽取的候选者数量"""
        return len(self._names) - len(self._excluded_indices)
        
    def get_total_count(self) -> int:
        """获取总候选者数量"""
        return len(self._names)
        
    def get_all_names(self) -> list:
        """获取所有候选者名称
        
        Returns:
            所有候选者名称列表
        """
        return self._names.copy()
    
    def get_candidates_with_weights(self) -> List[Tuple[str, float]]:
        """
        获取所有候选者及其权重
        
        Returns:
            包含(候选者名称, 权重)元组的列表
        """
        return list(zip(self._names, self._weights))
    
    def get_available_candidates(self) -> List[str]:
        """
        获取所有未抽取的候选者
        
        Returns:
            未抽取的候选者名称列表
        """
        return [self._names[i] for i in range(len(self._names)) if i not in self._excluded_indices]
    
    def get_all_names(self) -> List[str]:
        """
        获取所有候选者名称（不考虑是否已抽取）
        
        Returns:
            所有候选者名称列表
        """
        return self._names.copy()
    
    def clear(self) -> None:
        """清空所有候选者数据"""
        self._names = []
        self._weights = []
        self._excluded_indices = set()
